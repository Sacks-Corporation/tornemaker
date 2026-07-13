import { IsInt, IsOptional, IsString, Min } from 'class-validator';

/**
 * Payload for `PATCH /tournaments/match/:matchId`.
 *
 * `win`/`lose`/`draw` is always DERIVED from `homeGoals`/`awayGoals` by the
 * backend — never sent by the client. `penaltyWinnerTeamId` is only
 * required when this leg decides a tie that is level and doesn't admit a
 * draw (see `Match.allowsPenalties` / progression/match-result.util.ts for
 * the exact rule); sending it when it doesn't apply is a 400.
 */
export class RecordMatchResultDto {
  @IsInt()
  @Min(0)
  homeGoals: number;

  @IsInt()
  @Min(0)
  awayGoals: number;

  @IsOptional()
  @IsString()
  penaltyWinnerTeamId?: string;
}
