import { Types } from 'mongoose';

/** A team as submitted in the create-tournament payload, pre-draw. */
export interface DrawTeamInput {
  name: string;
  /** Empty array = CPU/AI-controlled team. */
  playerNames: string[];
}

/**
 * A team after the random draw has run: it has a stable `teamId`, its
 * shuffled position is captured as `seed` (1-based), and `hexId` is the
 * string form used everywhere `Match.homeTeamId/awayTeamId` (String fields)
 * need to reference it.
 */
export interface SeededTeam {
  teamId: Types.ObjectId;
  hexId: string;
  name: string;
  playerNames: string[];
  seed: number;
}
