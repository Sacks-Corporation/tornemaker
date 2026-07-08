/** Internal sentinel used to pad an odd-sized field so the circle method works. */
const BYE = '__BYE__';

/**
 * Classic "circle method" round-robin scheduler: given a list of team ids
 * (local `Team.teamId` hex strings), returns one round per array entry, each
 * round being the list of `[home, away]` pairs to play that round.
 *
 * Handles odd-sized inputs (e.g. a 3 or 5-team group, or a 7-team league) by
 * padding with an internal BYE placeholder — whichever real team is paired
 * against BYE in a given round simply doesn't play that round, exactly like
 * a normal round-robin "bye week".
 *
 * For `n` (even, post-padding) teams this produces `n - 1` rounds; combined
 * with every team facing every other team exactly once, this is the
 * standard single round-robin. Home/away is alternated round-by-round for a
 * reasonably balanced schedule (not the primary concern here since which
 * teams meet matters far more than who's nominally "home").
 */
export function circleMethodRounds(teamIds: string[]): [string, string][][] {
  const padded = [...teamIds];
  if (padded.length % 2 !== 0) {
    padded.push(BYE);
  }
  const n = padded.length;
  if (n < 2) {
    return [];
  }

  const rounds: [string, string][][] = [];
  let current = [...padded];

  for (let round = 0; round < n - 1; round++) {
    const pairs: [string, string][] = [];
    for (let i = 0; i < n / 2; i++) {
      const home = current[i];
      const away = current[n - 1 - i];
      if (home !== BYE && away !== BYE) {
        pairs.push(round % 2 === 0 ? [home, away] : [away, home]);
      }
    }
    rounds.push(pairs);

    // Rotate every team but the first by one position.
    const fixed = current[0];
    const rest = current.slice(1);
    rest.unshift(rest.pop() as string);
    current = [fixed, ...rest];
  }

  return rounds;
}
