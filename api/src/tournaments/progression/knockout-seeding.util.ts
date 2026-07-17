import { SeededTeam } from '../draw/types';
import { Team } from '../schemas/common/team.schema';

/** Builds a `SeededTeam[]` (the input `buildKnockoutStage` expects) out of an
 *  already-decided, ordered list of qualifier teamIds (best to worst). */
export function toSeededTeams(
  orderedTeamIds: string[],
  teams: Team[],
): SeededTeam[] {
  const byHexId = new Map(teams.map((t) => [t.teamId.toString(), t]));
  return orderedTeamIds.map((teamId, index) => {
    const team = byHexId.get(teamId);
    if (!team) {
      throw new Error(`Unknown teamId while seeding knockout stage: ${teamId}`);
    }
    return {
      teamId: team.teamId,
      hexId: teamId,
      name: team.name,
      playerNames: team.playerNames,
      seed: index + 1,
    };
  });
}

/**
 * Builds the seeding order fed into `buildKnockoutStage` for a group stage's
 * qualifiers (top 2 of every group — there is no "best third-placed teams"
 * tier anymore).
 *
 * Two things `buildKnockoutStage` cares about, both driven by array
 * position:
 *   1. Byes go to whichever teams sit at the FRONT of the array
 *      (`teams.slice(0, byeCount)`) when `2 * groupCount` isn't a power of
 *      two. Per the product rule, group WINNERS must be prioritized to
 *      receive those byes, so every entry of `firsts` is placed before every
 *      entry of `seconds`.
 *   2. Whichever teams DON'T get a bye are paired ADJACENTLY for the
 *      preliminary round (or, when there's no preliminary round at all,
 *      adjacent pairs directly form round 1) — see knockout-fixtures.ts. To
 *      reduce (not guarantee — see the note below) a group's own runner-up
 *      landing adjacent to a leftover, non-byed winner from a DIFFERENT
 *      alignment of the array, `seconds` is rotated by one position before
 *      being appended; this is the same rotation trick the previous
 *      (pre-best-thirds) version of this function used to avoid the obvious
 *      same-group collision, not a claim of globally optimal seeding.
 *
 * Result: `[...firsts, ...rotatedSeconds]`.
 */
export function buildGroupQualifiersSeedOrder(
  firsts: string[],
  seconds: string[],
): string[] {
  const rotatedSeconds =
    seconds.length > 1 ? [...seconds.slice(1), seconds[0]] : [...seconds];

  return [...firsts, ...rotatedSeconds];
}

/**
 * Classic single-elimination "standard seeding" position order: for `n`
 * qualifiers (n a power of two), returns the 1-based seed number that
 * belongs in each bracket slot (0-indexed), such that adjacent slots (0,1),
 * (2,3), ... are round-1 matchups and, assuming higher seeds keep winning,
 * seed 1 only meets seed 2 in the final. Used to seed the knockout bracket
 * built after a Swiss stage (`buildKnockoutStage` pairs adjacent entries of
 * the array it's given — see knockout-fixtures.ts).
 */
function standardSeedPositions(n: number): number[] {
  let positions = [1];
  while (positions.length < n) {
    const size = positions.length * 2;
    const next: number[] = [];
    for (const p of positions) {
      next.push(p, size + 1 - p);
    }
    positions = next;
  }
  return positions;
}

/** Applies `standardSeedPositions` to an already-ranked (best-to-worst) list of teamIds. */
export function standardKnockoutSeedOrder(rankedTeamIds: string[]): string[] {
  return standardSeedPositions(rankedTeamIds.length).map(
    (seedNumber) => rankedTeamIds[seedNumber - 1],
  );
}
