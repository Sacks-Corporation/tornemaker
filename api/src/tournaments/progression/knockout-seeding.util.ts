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
 * qualifiers, so the first knockout round avoids pairing two teams from the
 * same group whenever there is more than one group.
 *
 * Criterion (documented, not "optimal" seeding — just avoids the obvious
 * same-group collision): `buildKnockoutStage` pairs ADJACENT entries of the
 * array it's given (team[0] vs team[1], team[2] vs team[3], ...). So:
 *   1. `firsts` = each group's rank-1 team, in group order.
 *   2. `seconds` = each group's rank-2 team, in group order, ROTATED by one
 *      position. Rotating means `firsts[i]` is paired against a
 *      rank-2 team from a DIFFERENT group (its own rank-2 rotates away),
 *      which is only impossible when there is exactly one group.
 *   3. Interleave: [firsts[0], seconds[0], firsts[1], seconds[1], ...].
 *   4. Append the ranked best-third-placed teams (if any) at the end, as
 *      adjacent pairs in their ranked order.
 */
export function buildGroupQualifiersSeedOrder(
  firsts: string[],
  seconds: string[],
  rankedThirds: string[],
): string[] {
  const rotatedSeconds =
    seconds.length > 1 ? [...seconds.slice(1), seconds[0]] : [...seconds];

  const interleaved: string[] = [];
  for (let i = 0; i < firsts.length; i++) {
    interleaved.push(firsts[i]);
    if (rotatedSeconds[i] !== undefined) {
      interleaved.push(rotatedSeconds[i]);
    }
  }

  return [...interleaved, ...rankedThirds];
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
