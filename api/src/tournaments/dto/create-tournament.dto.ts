import { Transform, TransformFnParams, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayNotEmpty,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
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
 * `teamCount` here is `teams.length` — the REAL, organizer-submitted team
 * count. It is range/set-checked per `format` (`teamRange`/`teamCounts` from
 * `dto/format-rules.ts`), and `groupCap`/`aiFill`'s applicability to a given
 * `format`, plus every other cross-field rule (players-per-team, assignment
 * consistency, group-distribution validity), is validated in the service
 * layer against `dto/format-rules.ts` — those constraints are inherently
 * cross-field and don't fit class-validator's per-property model cleanly.
 *
 * `groupCap` is only meaningful for GROUP_STAGE_PLUS_ELIMINATION: the MAX
 * size of any group (replaces the old, uniform `groupSize`) — see
 * `dto/format-rules.ts#computeGroupDistribution`.
 *
 * `aiFill` (default `false`) only applies to the two formats that allow
 * CPU/AI teams (`allowsAi` on `GET /utils/tournament-formats`) —
 * SINGLE_ELIMINATION and GROUP_STAGE_PLUS_ELIMINATION. When `true`, the
 * service pads `teamCount` up with AI-controlled teams (auto-generated
 * names, unassigned — see `Tournament.aiFill`) before drawing, so the ACTUAL
 * number of teams in the draw can exceed `teamCount`/`teams.length`.
 *
 * `consoles` and `matchMode` are plain, non-empty strings here (NOT
 * `@IsEnum`): the Mongo-backed `consoles`/`matchmodes` catalogs (see
 * `UtilsService`) are the single source of truth for which `code`s are
 * valid, so membership is checked in the service layer against the active
 * catalog entries instead of a closed TypeScript enum.
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

  /** Must be an active `code` in the `matchmodes` catalog (see UtilsService). */
  @IsString()
  @IsNotEmpty()
  matchMode: string;

  @IsBoolean()
  twoLegged: boolean;

  @IsBoolean()
  thirdPlaceMatch: boolean;

  /** Required (min 3, otherwise free) only for GROUP_STAGE_PLUS_ELIMINATION
   *  — replaces the old, uniform `groupSize`; this is a CAP on group size,
   *  see `dto/format-rules.ts#computeGroupDistribution`. */
  @IsOptional()
  @IsInt()
  @Min(3)
  groupCap?: number;

  /** Only allowed for formats with `allowsAi` (SINGLE_ELIMINATION,
   *  GROUP_STAGE_PLUS_ELIMINATION). Defaults to `false` — see class doc. */
  @IsOptional()
  @IsBoolean()
  aiFill?: boolean;

  /** Each entry must be an active `code` in the `consoles` catalog (see UtilsService). */
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  consoles: string[];

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
