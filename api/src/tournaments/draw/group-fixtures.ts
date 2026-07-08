import { computeBestThirdPlaceSlots } from '../dto/format-rules';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { Match } from '../schemas/common/match.schema';
import { Standing } from '../schemas/common/standing.schema';
import { Group, GroupStage } from '../schemas/group-stage.schema';
import { circleMethodRounds } from './round-robin.util';
import { SeededTeam } from './types';

const GROUP_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function buildGroupMatches(
  letter: string,
  ids: string[],
  twoLegged: boolean,
): Match[] {
  const rounds = circleMethodRounds(ids);
  const matches: Match[] = [];
  let counter = 1;

  for (const pairs of rounds) {
    for (const [home, away] of pairs) {
      matches.push({
        matchId: `GROUP-${letter}-M${counter++}`,
        homeTeamId: home,
        awayTeamId: away,
        isTwoLegged: false,
        legs: [],
        status: MatchStatus.SCHEDULED,
        isDraw: false,
      });
    }
  }

  if (twoLegged) {
    for (const pairs of rounds) {
      for (const [home, away] of pairs) {
        matches.push({
          matchId: `GROUP-${letter}-M${counter++}`,
          homeTeamId: away,
          awayTeamId: home,
          isTwoLegged: false,
          legs: [],
          status: MatchStatus.SCHEDULED,
          isDraw: false,
        });
      }
    }
  }

  return matches;
}

/**
 * Builds the GROUP_STAGE_PLUS_ELIMINATION group stage: distributes the
 * already-shuffled teams into contiguous groups of `groupSize` ("Grupo A",
 * "Grupo B", ...), round-robins each group (single or double per
 * `twoLegged`), and computes `bestThirdPlaceSlots` so the future knockout
 * bracket (built once this stage finishes — NOT here, see
 * group-stage.schema.ts) closes on a clean power of two.
 */
export function buildGroupStage(
  teams: SeededTeam[],
  groupSize: number,
  twoLegged: boolean,
): GroupStage {
  const groupCount = teams.length / groupSize;
  const groups: Group[] = [];

  for (let g = 0; g < groupCount; g++) {
    const groupTeams = teams.slice(g * groupSize, (g + 1) * groupSize);
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
      matches: buildGroupMatches(letter, ids, twoLegged),
      standings,
    });
  }

  return {
    groupSize,
    doubleRound: twoLegged,
    groups,
    bestThirdPlaceSlots: computeBestThirdPlaceSlots(groupCount),
    qualifiedThirdPlaceTeamIds: [],
  };
}
