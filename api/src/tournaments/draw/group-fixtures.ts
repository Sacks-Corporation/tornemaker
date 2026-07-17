import { Types } from 'mongoose';
import { computeGroupDistribution } from '../dto/format-rules';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { Match } from '../schemas/common/match.schema';
import { Standing } from '../schemas/common/standing.schema';
import { Group, GroupStage } from '../schemas/group-stage.schema';
import { circleMethodRounds } from './round-robin.util';
import { SeededTeam } from './types';

const GROUP_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Group-stage fixtures are draw-eligible (league-style rules) — see
 *  Match.allowsPenalties doc. */
const GROUP_ALLOWS_PENALTIES = false;

function newMatchId(): string {
  return new Types.ObjectId().toString();
}

function buildGroupMatches(ids: string[], twoLegged: boolean): Match[] {
  const rounds = circleMethodRounds(ids);
  const matches: Match[] = [];

  for (const pairs of rounds) {
    for (const [home, away] of pairs) {
      matches.push({
        matchId: newMatchId(),
        homeTeamId: home,
        awayTeamId: away,
        isTwoLegged: false,
        legs: [],
        status: MatchStatus.SCHEDULED,
        isDraw: false,
        allowsPenalties: GROUP_ALLOWS_PENALTIES,
      });
    }
  }

  if (twoLegged) {
    for (const pairs of rounds) {
      for (const [home, away] of pairs) {
        matches.push({
          matchId: newMatchId(),
          homeTeamId: away,
          awayTeamId: home,
          isTwoLegged: false,
          legs: [],
          status: MatchStatus.SCHEDULED,
          isDraw: false,
          allowsPenalties: GROUP_ALLOWS_PENALTIES,
        });
      }
    }
  }

  return matches;
}

/**
 * Builds the GROUP_STAGE_PLUS_ELIMINATION group stage: distributes the
 * already-shuffled teams into contiguous groups ("Grupo A", "Grupo B", ...)
 * sized per `computeGroupDistribution(teams.length, groupCap)` (balanced,
 * every group capped at `groupCap`, sizes differing by at most 1 — see that
 * function's doc for the algorithm), then round-robins each group (single or
 * double per `twoLegged`).
 *
 * ONLY the top 2 of every group qualify for the knockout stage — there is no
 * "best third-placed teams" mechanism anymore (removed together with
 * `bestThirdPlaceSlots`/`computeBestThirdPlaceSlots`): when
 * `2 * groupCount` isn't a power of two, the follow-up knockout bracket is
 * resolved with byes/a preliminary round instead (same generic mechanism as
 * SINGLE_ELIMINATION — see draw/knockout-fixtures.ts and
 * progression/match-progression.service.ts#finishGroupStage).
 *
 * `teams.length` and `groupCap` are assumed already validated (by the same
 * `computeGroupDistribution` call, at the service layer) to form a valid
 * distribution; this throws if that invariant was violated by the caller.
 */
export function buildGroupStage(
  teams: SeededTeam[],
  groupCap: number,
  twoLegged: boolean,
): GroupStage {
  const distribution = computeGroupDistribution(teams.length, groupCap);
  if (!distribution.valid) {
    throw new Error(
      `buildGroupStage: invalid team/group distribution — ${distribution.reason}`,
    );
  }
  const { groupSizes } = distribution;

  const groups: Group[] = [];
  let offset = 0;

  for (let g = 0; g < groupSizes.length; g++) {
    const size = groupSizes[g];
    const groupTeams = teams.slice(offset, offset + size);
    offset += size;

    const ids = groupTeams.map((t) => t.hexId);
    const letter = GROUP_LETTERS[g];

    const standings: Standing[] = groupTeams.map((t) => ({
      teamId: t.hexId,
      played: 0,
      won: 0,
      drawn: 0,
      lost: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    }));

    groups.push({
      name: `Grupo ${letter}`,
      teamIds: ids,
      matches: buildGroupMatches(ids, twoLegged),
      standings,
      tiebreakMatches: [],
    });
  }

  return {
    groupCap,
    doubleRound: twoLegged,
    groups,
    // Vestigial — always 0/[] for newly-built stages, kept only so
    // historical documents (pre-dynamic-team-count) keep serializing with
    // the same shape. See GroupStage schema doc.
    bestThirdPlaceSlots: 0,
    qualifiedThirdPlaceTeamIds: [],
  };
}
