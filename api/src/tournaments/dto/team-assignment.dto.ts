import {
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Min,
} from 'class-validator';

/**
 * Links one entry of the payload's `teams` array (by index) to the real
 * player(s) controlling it. `teamIndex` refers to the `teams` array of the
 * same `CreateTournamentDto`, not to any persisted `Team.teamId` (those are
 * only generated once the draw runs).
 */
export class TeamAssignmentDto {
  @IsInt()
  @Min(0)
  teamIndex: number;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  players: string[];
}
