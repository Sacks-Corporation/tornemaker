import { Types } from 'mongoose';
import { buildGroupStage } from '../draw/group-fixtures';
import { buildKnockoutStage } from '../draw/knockout-fixtures';
import { buildLeagueStage } from '../draw/league-fixtures';
import { buildSwissStage } from '../draw/swiss-fixtures';
import { makeSeededTeams } from '../draw/test-helpers';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { Team } from '../schemas/common/team.schema';
import { TournamentFormat } from '../schemas/common/tournament-format.enum';
import { TournamentState } from '../schemas/common/tournament-state.enum';
import {
  Tournament,
  TournamentDocument,
  TournamentStatus,
} from '../schemas/tournament.schema';
import { MatchProgressionService } from './match-progression.service';

function toTeams(seeded: ReturnType<typeof makeSeededTeams>): Team[] {
  return seeded.map((t) => ({
    teamId: t.teamId,
    name: t.name,
    playerNames: t.playerNames,
    seed: t.seed,
  }));
}

function baseTournament(overrides: Partial<Tournament>): TournamentDocument {
  return {
    _id: new Types.ObjectId(),
    ownerId: new Types.ObjectId(),
    name: 'Test tournament',
    status: TournamentStatus.EN_PROGRESO,
    matchMode: '1v1',
    consoleUnits: ['PLAY_5'],
    allowedConsoles: ['PLAY_5'],
    teams: [],
    ...overrides,
  } as unknown as TournamentDocument;
}

/** Lower seed always wins 2-0 (deterministic, tie-free results). */
function winnerDtoBySeed(
  teams: Team[],
  homeTeamId?: string,
  awayTeamId?: string,
) {
  const homeSeed =
    teams.find((t) => t.teamId.toString() === homeTeamId)?.seed ?? 0;
  const awaySeed =
    teams.find((t) => t.teamId.toString() === awayTeamId?.toString())?.seed ??
    0;
  return homeSeed < awaySeed
    ? { homeGoals: 2, awayGoals: 0 }
    : { homeGoals: 0, awayGoals: 2 };
}

describe('MatchProgressionService — LEAGUE', () => {
  it('finishes the tournament once every matchday is played (strict/tie-free ordering)', () => {
    const service = new MatchProgressionService();
    const seeded = makeSeededTeams(4);
    const teams = toTeams(seeded);
    const leagueStage = buildLeagueStage(seeded, false);
    const tournament = baseTournament({
      format: TournamentFormat.LEAGUE,
      state: TournamentState.LEAGUE,
      teams,
      leagueStage,
    });

    for (const matchday of tournament.leagueStage!.matchdays) {
      for (const match of matchday.matches) {
        const dto = winnerDtoBySeed(teams, match.homeTeamId, match.awayTeamId);
        service.recordResult(tournament, match.matchId, dto);
      }
    }

    expect(tournament.state).toBe(TournamentState.FINISHED);
    expect(tournament.status).toBe(TournamentStatus.TERMINADO);
    expect(tournament.finishedAt).toBeInstanceOf(Date);
    expect(tournament.startedAt).toBeInstanceOf(Date);

    const standings = tournament.leagueStage!.standings;
    const bySeed = (seed: number) =>
      standings.find(
        (s) =>
          s.teamId === teams.find((t) => t.seed === seed)!.teamId.toString(),
      );
    expect(bySeed(1)!.rank).toBe(1);
    expect(bySeed(2)!.rank).toBe(2);
    expect(bySeed(3)!.rank).toBe(3);
    expect(bySeed(4)!.rank).toBe(4);
  });
});

describe('MatchProgressionService — GROUP_STAGE_PLUS_ELIMINATION', () => {
  it('transitions GROUPS -> KNOCKOUTS -> FINISHED', () => {
    const service = new MatchProgressionService();
    const seeded = makeSeededTeams(6); // 2 groups of 3, no best-thirds needed
    const teams = toTeams(seeded);
    const groupStage = buildGroupStage(seeded, 3, false);
    const tournament = baseTournament({
      format: TournamentFormat.GROUP_STAGE_PLUS_ELIMINATION,
      state: TournamentState.GROUPS,
      teams,
      groupStage,
    });

    for (const group of tournament.groupStage!.groups) {
      for (const match of group.matches) {
        const dto = winnerDtoBySeed(teams, match.homeTeamId, match.awayTeamId);
        service.recordResult(tournament, match.matchId, dto);
      }
    }

    expect(tournament.state).toBe(TournamentState.KNOCKOUTS);
    expect(tournament.knockoutStage).toBeDefined();
    const bracket = tournament.knockoutStage!.bracket;
    expect(bracket.rounds).toHaveLength(2); // 4 qualifiers -> semis + final

    for (const round of bracket.rounds) {
      for (const match of round.matches) {
        if (!match.homeTeamId || !match.awayTeamId) continue;
        const dto = winnerDtoBySeed(teams, match.homeTeamId, match.awayTeamId);
        service.recordResult(tournament, match.matchId, dto);
      }
    }

    expect(tournament.state).toBe(TournamentState.FINISHED);
    expect(tournament.knockoutStage!.bracket.championTeamId).toBeDefined();
  });
});

describe('MatchProgressionService — SWISS_PLUS_ELIMINATION', () => {
  function playOutSwissRound1(
    service: MatchProgressionService,
    tournament: TournamentDocument,
    teams: Team[],
  ) {
    for (const match of tournament.swissStage!.rounds[0].matches) {
      const dto = winnerDtoBySeed(teams, match.homeTeamId, match.awayTeamId);
      service.recordResult(tournament, match.matchId, dto);
    }
  }

  it('transitions SWISS -> KNOCKOUTS once targetQualifiers is reached, with a single-leg bracket when knockoutTwoLegged=false', () => {
    const service = new MatchProgressionService();
    const seeded = makeSeededTeams(4);
    const teams = toTeams(seeded);
    const swissStage = buildSwissStage(seeded, false);
    // Speed the test up: 1 win qualifies, 1 loss eliminates, target = 2.
    swissStage.winsToQualify = 1;
    swissStage.lossesToEliminate = 1;
    swissStage.targetQualifiers = 2;

    const tournament = baseTournament({
      format: TournamentFormat.SWISS_PLUS_ELIMINATION,
      state: TournamentState.SWISS,
      teams,
      swissStage,
    });

    // Swiss matches are always single-leg, regardless of knockoutTwoLegged.
    expect(
      tournament.swissStage!.rounds[0].matches.every(
        (m) => m.isTwoLegged === false,
      ),
    ).toBe(true);

    playOutSwissRound1(service, tournament, teams);

    expect(tournament.state).toBe(TournamentState.KNOCKOUTS);
    expect(tournament.swissStage!.qualifiedTeamIds).toHaveLength(2);
    expect(tournament.knockoutStage).toBeDefined();
    expect(tournament.knockoutStage!.bracket.isTwoLegged).toBe(false);
    expect(
      tournament.knockoutStage!.bracket.rounds.every((r) =>
        r.matches.every((m) => m.isTwoLegged === false),
      ),
    ).toBe(true);
  });

  it('builds a two-legged bracket when knockoutTwoLegged=true, while Swiss rounds stay single-leg', () => {
    const service = new MatchProgressionService();
    const seeded = makeSeededTeams(4);
    const teams = toTeams(seeded);
    const swissStage = buildSwissStage(seeded, true);
    swissStage.winsToQualify = 1;
    swissStage.lossesToEliminate = 1;
    swissStage.targetQualifiers = 2;

    const tournament = baseTournament({
      format: TournamentFormat.SWISS_PLUS_ELIMINATION,
      state: TournamentState.SWISS,
      teams,
      swissStage,
    });

    expect(swissStage.knockoutTwoLegged).toBe(true);
    expect(
      tournament.swissStage!.rounds[0].matches.every(
        (m) => m.isTwoLegged === false,
      ),
    ).toBe(true);

    playOutSwissRound1(service, tournament, teams);

    expect(tournament.state).toBe(TournamentState.KNOCKOUTS);
    const bracket = tournament.knockoutStage!.bracket;
    expect(bracket.isTwoLegged).toBe(true);
    expect(
      bracket.rounds.every((r) =>
        r.matches.every((m) => m.isTwoLegged === true),
      ),
    ).toBe(true);

    // Play the final as an aggregate draw -> penalties required on leg 2 only.
    const final = bracket.rounds[bracket.rounds.length - 1].matches[0];
    service.recordResult(tournament, final.matchId, {
      homeGoals: 1,
      awayGoals: 1,
    });
    expect(final.status).toBe(MatchStatus.SCHEDULED);
    expect(final.legs).toHaveLength(1);

    expect(() =>
      service.recordResult(tournament, final.matchId, {
        homeGoals: 1,
        awayGoals: 1,
      }),
    ).toThrow(); // aggregate level, penaltyWinnerTeamId required

    service.recordResult(tournament, final.matchId, {
      homeGoals: 1,
      awayGoals: 1,
      penaltyWinnerTeamId: final.awayTeamId,
    });
    expect(final.status).toBe(MatchStatus.PLAYED);
    expect(final.winnerTeamId).toBe(final.awayTeamId);
    expect(tournament.state).toBe(TournamentState.FINISHED);
    expect(bracket.championTeamId).toBe(final.awayTeamId);
  });
});

describe('MatchProgressionService — SINGLE_ELIMINATION', () => {
  it('advances the bracket to a champion and finishes', () => {
    const service = new MatchProgressionService();
    const seeded = makeSeededTeams(4);
    const teams = toTeams(seeded);
    const knockoutStage = buildKnockoutStage(seeded, false, true);

    const tournament = baseTournament({
      format: TournamentFormat.SINGLE_ELIMINATION,
      state: TournamentState.KNOCKOUTS,
      teams,
      knockoutStage,
    });

    const bracket = tournament.knockoutStage!.bracket;
    for (const match of bracket.rounds[0].matches) {
      const dto = winnerDtoBySeed(teams, match.homeTeamId, match.awayTeamId);
      service.recordResult(tournament, match.matchId, dto);
    }

    // Third place match should now have both losers seeded in.
    expect(bracket.thirdPlaceMatch!.homeTeamId).toBeDefined();
    expect(bracket.thirdPlaceMatch!.awayTeamId).toBeDefined();

    // Final still pending -> not finished yet.
    expect(tournament.state).toBe(TournamentState.KNOCKOUTS);

    const finalMatch = bracket.rounds[1].matches[0];
    service.recordResult(
      tournament,
      finalMatch.matchId,
      winnerDtoBySeed(teams, finalMatch.homeTeamId, finalMatch.awayTeamId),
    );
    // Third place still pending: tournament shouldn't finish yet.
    expect(tournament.state).toBe(TournamentState.KNOCKOUTS);

    service.recordResult(
      tournament,
      bracket.thirdPlaceMatch!.matchId,
      winnerDtoBySeed(
        teams,
        bracket.thirdPlaceMatch!.homeTeamId,
        bracket.thirdPlaceMatch!.awayTeamId,
      ),
    );

    expect(tournament.state).toBe(TournamentState.FINISHED);
    expect(tournament.status).toBe(TournamentStatus.TERMINADO);
    expect(bracket.championTeamId).toBeDefined();
  });

  it('throws NotFoundException when the matchId does not exist in the tournament', () => {
    const service = new MatchProgressionService();
    const seeded = makeSeededTeams(4);
    const teams = toTeams(seeded);
    const knockoutStage = buildKnockoutStage(seeded, false, false);
    const tournament = baseTournament({
      format: TournamentFormat.SINGLE_ELIMINATION,
      state: TournamentState.KNOCKOUTS,
      teams,
      knockoutStage,
    });

    expect(() =>
      service.recordResult(tournament, 'does-not-exist', {
        homeGoals: 1,
        awayGoals: 0,
      }),
    ).toThrow('does-not-exist');
  });

  it('resolves a two-legged tie with an aggregate draw via penalties', () => {
    const service = new MatchProgressionService();
    const seeded = makeSeededTeams(2);
    const teams = toTeams(seeded);
    const knockoutStage = buildKnockoutStage(seeded, true, false);
    const tournament = baseTournament({
      format: TournamentFormat.SINGLE_ELIMINATION,
      state: TournamentState.KNOCKOUTS,
      teams,
      knockoutStage,
    });

    const match = knockoutStage.bracket.rounds[0].matches[0];
    service.recordResult(tournament, match.matchId, {
      homeGoals: 1,
      awayGoals: 0,
    });
    expect(match.status).toBe(MatchStatus.SCHEDULED);

    service.recordResult(tournament, match.matchId, {
      homeGoals: 0,
      awayGoals: 1,
      penaltyWinnerTeamId: match.awayTeamId,
    });

    expect(match.status).toBe(MatchStatus.PLAYED);
    expect(match.winnerTeamId).toBe(match.awayTeamId);
    expect(tournament.state).toBe(TournamentState.FINISHED);
    expect(knockoutStage.bracket.championTeamId).toBe(match.awayTeamId);
  });
});
