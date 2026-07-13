import { IsEnum, IsOptional } from 'class-validator';
import { TournamentFormat } from '../../tournaments/schemas/common/tournament-format.enum';

/**
 * Query params for `GET /utils/tournament-formats`. `format` is optional:
 * when present, only that format's rules are returned; when absent, every
 * supported format is returned (see UtilsService.getTournamentFormats).
 */
export class TournamentFormatsQueryDto {
  @IsOptional()
  @IsEnum(TournamentFormat)
  format?: TournamentFormat;
}
