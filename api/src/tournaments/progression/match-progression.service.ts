import { Injectable, NotFoundException } from '@nestjs/common';
import { buildKnockoutStage } from '../draw/knockout-fixtures';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { TournamentState } from '../schemas/common/tournament-state.enum';
import { Standing } from '../schemas/common/standing.schema';
import { Group, GroupStage } from '../schemas/group-stage.schema';
import { LeagueStage } from '../schemas/league.schema';
import { SwissStage } from '../schemas/swiss-stage.schema';
import {
  Tournament,
  TournamentDocument,
  TournamentStatus,
} from '../schemas/tournament.schema';
import { RecordMatchResultDto } from '../dto/record-match-result.dto';
import {
  advanceWinnerInBracket,
  isBracketComplete,
} from './bracket-advance.util';
import {
  collectAllMatches,
  ConsoleAssigner,
  ensureAssignedConsole,
} from './console-assignment.util';
import {
  buildGroupQualifiersSeedOrder,
  standardKnockoutSeedOrder,
  toSeededTeams,
} from './knockout-seeding.util';
import { locateMatch, MatchLocation } from './match-locator.util';
import { recordMatchResult } from './match-result.util';
import {
  compareStandings,
  computeBaseStandings,
  sortAndRank,
  StandingsPointsRules,
  TieGroup,
} from './standings.util';
import {
  applySwissMatchResult,
  buildPlayInMatches,
  pairNextSwissRound,
} from './swiss-pairing.util';
import { reconcileTieGroup, SeedLookup } from './tiebreak.util';

const GROUP_STANDINGS_RULES: StandingsPointsRules = {
  pointsForWin: 3,
  pointsForDraw: 1,
  pointsForLoss: 0,
};

/**
 * The progression engine: applies a single match result and recomputes /
 * persists everything downstream of it (standings, tiebreaks, bracket
 * advancement, Swiss pairing, stage transitions) — see the class-level doc
 * on `TournamentsService` for the overall contract this backs.
 *
 * Every method here mutates the passed-in `TournamentDocument` in place;
 * the caller (`TournamentsService`) is responsible for `save()`-ing it.
 */
@Injectable()
export class MatchProgressionService {
  recordResult(
    tournament: TournamentDocument,
    matchId: string,
    dto: RecordMatchResultDto,
  ): void {
    const location = locateMatch(tournament, matchId);
    if (!location) {
      throw new NotFoundException(
        `Match ${matchId} was not found in this tournament`,
      );
    }

    if (!tournament.startedAt) {
      tournament.startedAt = new Date();
    }

    const assigner = new ConsoleAssigner(
      tournament.consoleUnits,
      collectAllMatches(tournament).filter((m) => m.assignedConsole).length,
    );
    const assignedConsole = ensureAssignedConsole(location.match, assigner);

    const outcome = recordMatchResult(location.match, dto, assignedConsole);

    if (!outcome.isResolved) {
      // Only leg 1 of a two-legged tie was just recorded — nothing else to
      // progress until leg 2 comes in.
      return;
    }

    switch (location.phase) {
      case 'LEAGUE':
        this.progressLeague(tournament);
        break;
      case 'TIEBREAK':
        if (location.isLeagueTiebreak) {
          this.progressLeague(tournament);
        } else {
          this.progressGroups(tournament);
        }
        break;
      case 'GROUPS':
        this.progressGroups(tournament);
        break;
      case 'SWISS':
        this.progressSwiss(tournament, location);
        break;
      case 'PLAY_IN':
        this.progressSwissPlayIn(tournament);
        break;
      case 'KNOCKOUTS':
        this.progressKnockout(tournament, location, outcome.winnerTeamId);
        break;
      case 'THIRD_PLACE':
        this.progressThirdPlace(tournament);
        break;
    }
  }

  // --- LEAGUE --------------------------------------------------------

  private progressLeague(tournament: TournamentDocument): void {
    const stage = tournament.leagueStage as LeagueStage;
    const allMatches = stage.matchdays.flatMap((md) => md.matches);
    const allMatchdaysDone = allMatches.every((m) => isDone(m.status));

    const rules: StandingsPointsRules = {
      pointsForWin: stage.pointsForWin,
      pointsForDraw: stage.pointsForDraw,
      pointsForLoss: stage.pointsForLoss,
    };
    const teamIds = tournament.teams.map((t) => t.teamId.toString());
    const { standings, tieGroups } = sortAndRank(
      computeBaseStandings(teamIds, allMatches, rules),
    );
    stage.standings = standings;

    if (!allMatchdaysDone) {
      return; // still mid-league: state stays LEAGUE.
    }

    const seeds = this.seedLookup(tournament);
    // For the league's FINAL table, every remaining tie always "matters"
    // (every position of the final table is meaningful).
    const allResolved = this.reconcileAndApplyTieGroups(
      stage.standings,
      tieGroups,
      stage.tiebreakMatches,
      seeds,
    );

    if (allResolved) {
      this.finishTournament(tournament);
    }
  }

  // --- GROUPS ----------------------------------------------------------

  private progressGroups(tournament: TournamentDocument): void {
    const stage = tournament.groupStage as GroupStage;
    const seeds = this.seedLookup(tournament);

    const groupsComplete = stage.groups.map((group) =>
      this.recomputeGroup(group, stage.bestThirdPlaceSlots, seeds),
    );

    if (!groupsComplete.every(Boolean)) {
      return; // some group (or its tiebreaks) still pending.
    }

    this.finishGroupStage(tournament, stage);
  }

  /** Recomputes one group's standings and, if the group's own matches are
   *  all done, reconciles any tie that matters for its qualification
   *  boundary. Returns whether the group is fully resolved. */
  private recomputeGroup(
    group: Group,
    bestThirdPlaceSlots: number,
    seeds: SeedLookup[],
  ): boolean {
    const { standings, tieGroups } = sortAndRank(
      computeBaseStandings(group.teamIds, group.matches, GROUP_STANDINGS_RULES),
    );
    group.standings = standings;

    const allMatchesDone = group.matches.every((m) => isDone(m.status));
    if (!allMatchesDone) {
      return false;
    }

    const matteringGroups = tieGroups.filter((tg) =>
      tieMattersForGroup(tg, bestThirdPlaceSlots),
    );
    const nonMatteringGroups = tieGroups.filter(
      (tg) => !tieMattersForGroup(tg, bestThirdPlaceSlots),
    );

    // Ties that don't affect qualification are still given a definitive
    // order (by seed) so `standings` is always a total order, but never
    // block progression and never need an extra match.
    for (const tieGroup of nonMatteringGroups) {
      applyResolvedOrder(
        group.standings,
        tieGroup,
        [...tieGroup.teamIds].sort(
          (a, b) => seedOf(a, seeds) - seedOf(b, seeds),
        ),
      );
    }

    let allMatteringResolved = true;
    for (const tieGroup of matteringGroups) {
      const result = reconcileTieGroup(
        tieGroup.teamIds,
        group.tiebreakMatches,
        seeds,
      );
      applyResolvedOrder(group.standings, tieGroup, result.order);
      if (!result.resolved) {
        allMatteringResolved = false;
      }
    }

    return allMatteringResolved;
  }

  private finishGroupStage(
    tournament: TournamentDocument,
    stage: GroupStage,
  ): void {
    const firsts = stage.groups.map(
      (g) => g.standings.find((s) => s.rank === 1)?.teamId as string,
    );
    const seconds = stage.groups.map(
      (g) => g.standings.find((s) => s.rank === 2)?.teamId as string,
    );

    let rankedThirds: string[] = [];
    if (stage.bestThirdPlaceSlots > 0) {
      const seeds = this.seedLookup(tournament);
      const thirds = stage.groups
        .map((g) => g.standings.find((s) => s.rank === 3))
        .filter((s): s is Standing => Boolean(s));
      const sortedThirds = [...thirds].sort((a, b) => {
        const cmp = compareStandings(a, b);
        return cmp !== 0
          ? cmp
          : seedOf(a.teamId, seeds) - seedOf(b.teamId, seeds);
      });
      rankedThirds = sortedThirds
        .slice(0, stage.bestThirdPlaceSlots)
        .map((s) => s.teamId);
      stage.qualifiedThirdPlaceTeamIds = rankedThirds;
    }

    const seedOrder = buildGroupQualifiersSeedOrder(
      firsts,
      seconds,
      rankedThirds,
    );
    const seededTeams = toSeededTeams(seedOrder, tournament.teams);

    const wantsThirdPlace = Boolean(tournament.thirdPlaceMatch);
    // NOTE (documented deviation): the two-legged-ness of the follow-up
    // knockout bracket has no dedicated persisted field for this format —
    // `CreateTournamentDto.twoLegged` was only ever applied to the group
    // fixtures' own double round-robin (`GroupStage.doubleRound`). We reuse
    // that same flag here as the closest available signal; flagged for the
    // product owner to add a dedicated field if a different behaviour is
    // desired.
    const twoLegged = stage.doubleRound;

    tournament.knockoutStage = buildKnockoutStage(
      seededTeams,
      twoLegged,
      wantsThirdPlace,
    );
    tournament.thirdPlaceMatch = undefined;
    tournament.state = TournamentState.KNOCKOUTS;
  }

  // --- SWISS -------------------------------------------------------------

  private progressSwiss(
    tournament: TournamentDocument,
    location: MatchLocation,
  ): void {
    const stage = tournament.swissStage as SwissStage;
    const match = location.match;
    const home = stage.participants.find((p) => p.teamId === match.homeTeamId);
    const away = stage.participants.find((p) => p.teamId === match.awayTeamId);
    if (!home || !away) {
      throw new NotFoundException('Swiss participant not found for match');
    }

    const leg = match.legs[match.legs.length - 1];
    applySwissMatchResult(
      home,
      away,
      leg.homeGoals,
      leg.awayGoals,
      match.winnerTeamId as string,
      stage.winsToQualify,
      stage.lossesToEliminate,
    );

    const currentRound = stage.rounds[location.roundIndex as number];
    const roundDone = currentRound.matches.every((m) => isDone(m.status));
    if (!roundDone) {
      return;
    }

    this.advanceSwissStage(tournament, stage);
  }

  private progressSwissPlayIn(tournament: TournamentDocument): void {
    const stage = tournament.swissStage as SwissStage;
    const allPlayInDone = stage.playIn.every((m) => isDone(m.status));
    if (!allPlayInDone) {
      return;
    }
    // Every play-in match's winner joins the qualified pool; losers are out.
    for (const match of stage.playIn) {
      if (
        match.winnerTeamId &&
        !stage.qualifiedTeamIds.includes(match.winnerTeamId)
      ) {
        stage.qualifiedTeamIds.push(match.winnerTeamId);
      }
    }
    this.finishSwissStage(tournament, stage);
  }

  private advanceSwissStage(
    tournament: TournamentDocument,
    stage: SwissStage,
  ): void {
    const qualified = stage.participants.filter((p) => p.isQualified);

    if (qualified.length === stage.targetQualifiers) {
      stage.qualifiedTeamIds = this.rankSwissParticipants(
        tournament,
        qualified,
      ).map((p) => p.teamId);
      this.finishSwissStage(tournament, stage);
      return;
    }

    if (qualified.length > stage.targetQualifiers) {
      const ranked = this.rankSwissParticipants(tournament, qualified).map(
        (p) => p.teamId,
      );
      stage.playIn = buildPlayInMatches(ranked, stage.targetQualifiers);
      // Teams that directly made the cut without needing the play-in.
      stage.qualifiedTeamIds = ranked.slice(
        0,
        ranked.length - stage.playIn.length * 2,
      );
      return;
    }

    // Not enough qualifiers yet (and nobody in the play-in): pair up a new round.
    const nextMatches = pairNextSwissRound(stage.participants);
    if (nextMatches && nextMatches.length > 0) {
      const nextRoundNumber =
        (stage.rounds[stage.rounds.length - 1]?.roundNumber ?? 0) + 1;
      stage.rounds.push({ roundNumber: nextRoundNumber, matches: nextMatches });
    }
  }

  /** Ranked best-to-worst by game differential (the only Swiss tiebreaker
   *  documented on swiss-stage.schema.ts); ties broken by seed as a
   *  last resort so the order is always total and deterministic. */
  private rankSwissParticipants(
    tournament: TournamentDocument,
    participants: SwissStage['participants'],
  ): SwissStage['participants'] {
    const seeds = this.seedLookup(tournament);
    return [...participants].sort(
      (a, b) =>
        b.gameDifferential - a.gameDifferential ||
        seedOf(a.teamId, seeds) - seedOf(b.teamId, seeds),
    );
  }

  private finishSwissStage(
    tournament: TournamentDocument,
    stage: SwissStage,
  ): void {
    const wantsThirdPlace = Boolean(tournament.thirdPlaceMatch);
    // The Swiss stage's own matches are always single-leg; the follow-up
    // knockout bracket's two-legged-ness is whatever the organizer chose at
    // creation time, persisted on `SwissStage.knockoutTwoLegged` — see that
    // prop's doc on swiss-stage.schema.ts.
    const twoLegged = stage.knockoutTwoLegged;

    const seedOrder = standardKnockoutSeedOrder(stage.qualifiedTeamIds);
    const seededTeams = toSeededTeams(seedOrder, tournament.teams);

    tournament.knockoutStage = buildKnockoutStage(
      seededTeams,
      twoLegged,
      wantsThirdPlace,
    );
    tournament.thirdPlaceMatch = undefined;
    tournament.state = TournamentState.KNOCKOUTS;
  }

  // --- KNOCKOUTS -----------------------------------------------------

  private progressKnockout(
    tournament: TournamentDocument,
    location: MatchLocation,
    winnerTeamId: string | undefined,
  ): void {
    const bracket = tournament.knockoutStage?.bracket;
    if (!bracket || !winnerTeamId) {
      return;
    }

    const roundIndex = location.roundIndex as number;
    const matchIndex = location.matchIndex as number;
    const match = location.match;
    const loserTeamId =
      winnerTeamId === match.homeTeamId ? match.awayTeamId : match.homeTeamId;

    advanceWinnerInBracket(
      bracket,
      roundIndex,
      matchIndex,
      winnerTeamId,
      loserTeamId,
    );

    this.maybeFinishKnockout(tournament, bracket);
  }

  private progressThirdPlace(tournament: TournamentDocument): void {
    const bracket = tournament.knockoutStage?.bracket;
    if (!bracket) {
      return;
    }
    this.maybeFinishKnockout(tournament, bracket);
  }

  private maybeFinishKnockout(
    tournament: TournamentDocument,
    bracket: NonNullable<Tournament['knockoutStage']>['bracket'],
  ): void {
    if (isBracketComplete(bracket)) {
      this.finishTournament(tournament);
    }
  }

  // --- shared helpers --------------------------------------------------

  private finishTournament(tournament: TournamentDocument): void {
    tournament.state = TournamentState.FINISHED;
    tournament.status = TournamentStatus.TERMINADO;
    tournament.finishedAt = new Date();
  }

  private seedLookup(tournament: TournamentDocument): SeedLookup[] {
    return tournament.teams.map((t) => ({
      teamId: t.teamId.toString(),
      seed: t.seed,
    }));
  }

  /** Applies every tie group's reconciliation result onto `standings` (rank
   *  reassignment) and reports whether ALL of them are fully resolved. */
  private reconcileAndApplyTieGroups(
    standings: Standing[],
    tieGroups: TieGroup[],
    tiebreakMatchesPool: LeagueStage['tiebreakMatches'],
    seeds: SeedLookup[],
  ): boolean {
    let allResolved = true;
    for (const tieGroup of tieGroups) {
      const result = reconcileTieGroup(
        tieGroup.teamIds,
        tiebreakMatchesPool,
        seeds,
      );
      applyResolvedOrder(standings, tieGroup, result.order);
      if (!result.resolved) {
        allResolved = false;
      }
    }
    return allResolved;
  }
}

function isDone(status: MatchStatus): boolean {
  return status === MatchStatus.PLAYED || status === MatchStatus.WALKOVER;
}

function seedOf(teamId: string, seeds: SeedLookup[]): number {
  return seeds.find((s) => s.teamId === teamId)?.seed ?? Infinity;
}

/** Reassigns `rank` for a tie group's teams per its resolved best-to-worst order. */
function applyResolvedOrder(
  standings: Standing[],
  tieGroup: TieGroup,
  order: string[],
): void {
  order.forEach((teamId, idx) => {
    const standing = standings.find((s) => s.teamId === teamId);
    if (standing) {
      standing.rank = tieGroup.fromRank + idx;
    }
  });
  standings.sort((a, b) => (a.rank ?? 0) - (b.rank ?? 0));
}

/**
 * A group tie "matters" (per the business rule) when it spans:
 *   - the direct-qualification boundary (rank 2 / rank 3), or
 *   - the "who is exactly 3rd" boundary, but only when best-third slots are
 *     in play (`bestThirdPlaceSlots > 0`) — that team's identity feeds the
 *     cross-group best-third ranking.
 */
function tieMattersForGroup(
  tieGroup: TieGroup,
  bestThirdPlaceSlots: number,
): boolean {
  const spansDirectBoundary = tieGroup.fromRank <= 2 && tieGroup.toRank >= 2;
  const spansThirdBoundary =
    bestThirdPlaceSlots > 0 && tieGroup.fromRank <= 3 && tieGroup.toRank >= 3;
  return spansDirectBoundary || spansThirdBoundary;
}
