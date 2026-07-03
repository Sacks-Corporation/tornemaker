/**
 * Gaming consoles supported by the platform. A tournament may allow more than
 * one console (e.g. mixing Play 4 and Play 5), but every individual match
 * MUST record the console it was actually played on (see MatchResult.console).
 */
export enum GameConsole {
  PLAY_2 = 'PLAY_2',
  PLAY_3 = 'PLAY_3',
  PLAY_4 = 'PLAY_4',
  PLAY_5 = 'PLAY_5',
}
