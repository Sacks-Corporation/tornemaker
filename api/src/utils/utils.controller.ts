import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TournamentFormatsQueryDto } from './dto/tournament-formats-query.dto';
import {
  ConsoleCatalogItem,
  MatchModeCatalogItem,
  TournamentFormatRule,
  UtilsService,
} from './utils.service';

/**
 * Read-only catalog endpoints consumed by the frontend to render
 * tournament-creation options. Contract is pactado with the frontend — do
 * not change the response shapes without updating it there too.
 */
@Controller('utils')
export class UtilsController {
  constructor(private readonly utilsService: UtilsService) {}

  /** GET /utils/consoles */
  @UseGuards(JwtAuthGuard)
  @Get('consoles')
  getConsoles(): Promise<ConsoleCatalogItem[]> {
    return this.utilsService.getConsoles();
  }

  /** GET /utils/match-modes */
  @UseGuards(JwtAuthGuard)
  @Get('match-modes')
  getMatchModes(): Promise<MatchModeCatalogItem[]> {
    return this.utilsService.getMatchModes();
  }

  /** GET /utils/tournament-formats?format=<TournamentFormat> */
  @UseGuards(JwtAuthGuard)
  @Get('tournament-formats')
  getTournamentFormats(
    @Query() query: TournamentFormatsQueryDto,
  ): TournamentFormatRule[] {
    return this.utilsService.getTournamentFormats(query.format);
  }
}
