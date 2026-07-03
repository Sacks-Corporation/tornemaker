/**
 * Supported tournament formats. Each format activates a different (optional)
 * stage container on the Tournament document — see tournament.schema.ts.
 */
export enum TournamentFormat {
  /** Single-elimination bracket (with optional preliminary round for non power-of-two draws). */
  SINGLE_ELIMINATION = 'SINGLE_ELIMINATION',
  /** Group stage followed by a single-elimination bracket. */
  GROUP_STAGE_PLUS_ELIMINATION = 'GROUP_STAGE_PLUS_ELIMINATION',
  /** Round-robin league (single or double round-robin). */
  LEAGUE = 'LEAGUE',
  /** Swiss-system stage followed by a single-elimination bracket. */
  SWISS_PLUS_ELIMINATION = 'SWISS_PLUS_ELIMINATION',
}
