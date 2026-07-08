/**
 * How many real players sit behind each team for a given tournament: a
 * classic 1-on-1 match, or teams of 2 or 3 players sharing one side (co-op).
 * Drives how many entries `Team.playerNames` is expected to have.
 */
export enum MatchMode {
  ONE_VS_ONE = '1v1',
  TWO_VS_TWO = '2v2',
  THREE_VS_THREE = '3v3',
}
