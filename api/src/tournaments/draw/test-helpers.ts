import { Types } from 'mongoose';
import { SeededTeam } from './types';

/** Deterministic (non-shuffled) SeededTeam[] builder, for draw unit tests. */
export function makeSeededTeams(count: number): SeededTeam[] {
  return Array.from({ length: count }, (_, i) => {
    const teamId = new Types.ObjectId();
    return {
      teamId,
      hexId: teamId.toHexString(),
      name: `Team ${i + 1}`,
      playerNames: [`Player ${i + 1}`],
      seed: i + 1,
    };
  });
}
