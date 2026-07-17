import { Types } from 'mongoose';
import { nextPowerOfTwo } from '../dto/format-rules';
import { Bracket, BracketRound } from '../schemas/common/bracket.schema';
import { MatchStatus } from '../schemas/common/match-status.enum';
import { Match } from '../schemas/common/match.schema';
import { KnockoutStage } from '../schemas/knockout-stage.schema';
import { SeededTeam } from './types';

/** Every knockout match (main bracket, preliminary round, third place) may
 *  go to penalties when level — see Match.allowsPenalties doc. */
const KNOCKOUT_ALLOWS_PENALTIES = true;

function newMatchId(): string {
  return new Types.ObjectId().toString();
}

/** Human (Spanish) round name, keyed by how many teams enter that round. */
function roundName(teamsInRound: number): string {
  switch (teamsInRound) {
    case 2:
      return 'Final';
    case 4:
      return 'Semifinales';
    case 8:
      return 'Cuartos de Final';
    case 16:
      return 'Octavos de Final';
    case 32:
      return 'Dieciseisavos de Final';
    default:
      return `Ronda de ${teamsInRound}`;
  }
}

function placeholderMatch(isTwoLegged: boolean): Match {
  return {
    matchId: newMatchId(),
    isTwoLegged,
    legs: [],
    status: MatchStatus.SCHEDULED,
    isDraw: false,
    allowsPenalties: KNOCKOUT_ALLOWS_PENALTIES,
  };
}

/**
 * Builds a full single-elimination Bracket for `teams.length` (already
 * seeded/shuffled) teams, including every round down to the final — see
 * bracket.schema.ts for the byes/preliminary-round design this implements.
 *
 * Key invariant relied upon below: `byeCount + preliminaryWinners` always
 * equals `drawSize / 2` (proof: byeCount = drawSize - teamCount, winners =
 * (teamCount - byeCount) / 2, so byeCount + winners = drawSize / 2 exactly).
 * That's why the round right after the preliminary round always starts a
 * perfectly clean power-of-two bracket of size `drawSize / 2`, REGARDLESS of
 * how byeCount and preliminaryWinners individually split that total — which
 * matters now that `teamCount` is a free range instead of a hand-picked
 * closed set: byeCount can be smaller than the number of first-main-round
 * matches (e.g. teamCount=7 or 15), so some of those matches end up being
 * fought entirely between two preliminary-round winners, with no bye
 * involved at all — see the "flat entrants list" comment inside the
 * `hasPreliminaryRound` branch below, and its counterpart in
 * `progression/bracket-advance.util.ts#advanceWinnerInBracket`.
 */
export function buildKnockoutStage(
  teams: SeededTeam[],
  twoLegged: boolean,
  thirdPlaceMatch: boolean,
): KnockoutStage {
  const teamCount = teams.length;
  const drawSize = nextPowerOfTwo(teamCount);
  const byeCount = drawSize - teamCount;
  const hasPreliminaryRound = byeCount > 0;

  const rounds: BracketRound[] = [];
  let roundIndex = 0;
  let firstMainRoundSlots: Array<{ home?: string; away?: string }>;
  let firstMainSize: number;

  if (hasPreliminaryRound) {
    const byeTeamIds = teams.slice(0, byeCount).map((t) => t.hexId);
    const prelimTeamIds = teams.slice(byeCount).map((t) => t.hexId);

    const prelimMatches: Match[] = [];
    for (let i = 0; i < prelimTeamIds.length; i += 2) {
      prelimMatches.push({
        matchId: newMatchId(),
        homeTeamId: prelimTeamIds[i],
        awayTeamId: prelimTeamIds[i + 1],
        isTwoLegged: twoLegged,
        legs: [],
        status: MatchStatus.SCHEDULED,
        isDraw: false,
        allowsPenalties: KNOCKOUT_ALLOWS_PENALTIES,
      });
    }
    rounds.push({
      roundNumber: roundIndex,
      name: 'Ronda Preliminar',
      matches: prelimMatches,
    });
    roundIndex++;

    firstMainSize = drawSize / 2;
    const mainMatchCount = firstMainSize / 2;

    // Flat list of the `firstMainSize` entrants of the first main round:
    // the `byeCount` bye teams (already known) FIRST, followed by one
    // `undefined` placeholder per preliminary match (its winner, TBD until
    // that match is played — filled in later by
    // `bracket-advance.util.ts#advanceWinnerInBracket`, which uses this
    // EXACT same "byes first, then one slot per preliminary match, in
    // order" layout to compute where each preliminary winner lands).
    // Pairing this flat list 2-by-2 into `mainMatchCount` matches generically
    // covers every possible byeCount/winnersCount split — including byes
    // facing each other directly (byeCount > mainMatchCount, e.g. 20 teams),
    // two preliminary winners facing each other with no bye involved at all
    // (byeCount < mainMatchCount, e.g. 7 or 15 teams — this is the case the
    // OLD "one bye waits for one preliminary winner, same index" version of
    // this function got wrong, since it silently assumed byeCount was always
    // >= mainMatchCount), and everything in between.
    const flatEntrants: Array<string | undefined> = [
      ...byeTeamIds,
      ...prelimMatches.map(() => undefined),
    ];

    firstMainRoundSlots = [];
    for (let m = 0; m < mainMatchCount; m++) {
      firstMainRoundSlots.push({
        home: flatEntrants[2 * m],
        away: flatEntrants[2 * m + 1],
      });
    }
  } else {
    firstMainSize = drawSize;
    firstMainRoundSlots = [];
    for (let i = 0; i < teams.length; i += 2) {
      firstMainRoundSlots.push({
        home: teams[i].hexId,
        away: teams[i + 1].hexId,
      });
    }
  }

  const firstMainMatches: Match[] = firstMainRoundSlots.map((slot) => ({
    matchId: newMatchId(),
    homeTeamId: slot.home,
    awayTeamId: slot.away,
    isTwoLegged: twoLegged,
    legs: [],
    status: MatchStatus.SCHEDULED,
    isDraw: false,
    allowsPenalties: KNOCKOUT_ALLOWS_PENALTIES,
  }));
  rounds.push({
    roundNumber: roundIndex,
    name: roundName(firstMainSize),
    matches: firstMainMatches,
  });
  roundIndex++;

  // Remaining rounds are fully placeholder (teams TBD from previous winners).
  let teamsInRound = firstMainSize;
  while (teamsInRound > 2) {
    const nextTeamsInRound = teamsInRound / 2;
    const matchCount = nextTeamsInRound / 2;
    const matches: Match[] = Array.from({ length: matchCount }, () =>
      placeholderMatch(twoLegged),
    );
    rounds.push({
      roundNumber: roundIndex,
      name: roundName(nextTeamsInRound),
      matches,
    });
    roundIndex++;
    teamsInRound = nextTeamsInRound;
  }

  const bracket: Bracket = {
    drawSize,
    byeTeamIds: teams.slice(0, byeCount).map((t) => t.hexId),
    hasPreliminaryRound,
    rounds,
    isTwoLegged: twoLegged,
    hasThirdPlaceMatch: thirdPlaceMatch,
    // The 3rd-place decider is always single-match, even in a two-legged bracket.
    thirdPlaceMatch: thirdPlaceMatch ? placeholderMatch(false) : undefined,
  };

  return { bracket };
}
