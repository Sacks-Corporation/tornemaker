import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { GameConsole } from '../schemas/common/console.enum';
import { MatchMode } from '../schemas/common/match-mode.enum';
import { TournamentFormat } from '../schemas/common/tournament-format.enum';
import { TeamAssignmentDto } from './team-assignment.dto';

function trimIfString({ value }: TransformFnParams): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimStringArrayIfArray({ value }: TransformFnParams): unknown {
  const input: unknown = value;
  if (!Array.isArray(input)) {
    return input;
  }
  return input.map((v: unknown) => (typeof v === 'string' ? v.trim() : v));
}

/**
 * Payload for `POST /tournaments`. The fixture/draw is generated inside the
 * same request (see tournaments.service.ts / draw/draw.service.ts) so this
 * DTO carries everything needed to both validate the tournament config and
 * seed the draw: team names, the player pool, and how players are assigned
 * to teams.
 *
 * `groupSize` is only meaningful for GROUP_STAGE_PLUS_ELIMINATION; whether
 * it's required/forbidden for a given `format`, and every other cross-field
 * rule (team count per format, players-per-team, assignment consistency), is
 * validated in the service layer against `dto/format-rules.ts` — those
 * constraints are inherently cross-field and don't fit class-validator's
 * per-property model cleanly.
 */
export class CreateTournamentDto {
  @Transform(trimIfString)
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(TournamentFormat)
  format: TournamentFormat;

  @IsInt()
  @Min(1)
  teamCount: number;

  @IsEnum(MatchMode)
  matchMode: MatchMode;

  @IsBoolean()
  twoLegged: boolean;

  @IsBoolean()
  thirdPlaceMatch: boolean;

  /** Required (and restricted to 3/4/5) only for GROUP_STAGE_PLUS_ELIMINATION. */
  @IsOptional()
  @IsInt()
  @IsIn([3, 4, 5])
  groupSize?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsEnum(GameConsole, { each: true })
  consoles: GameConsole[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @Transform(trimStringArrayIfArray)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  teams: string[];

  @IsArray()
  @ArrayUnique()
  @Transform(trimStringArrayIfArray)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  players: string[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TeamAssignmentDto)
  assignments: TeamAssignmentDto[];
}
