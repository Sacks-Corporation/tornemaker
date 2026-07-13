import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateTournamentDto } from './dto/create-tournament.dto';
import { RecordMatchResultDto } from './dto/record-match-result.dto';
import { PlayableMatchItem } from './progression/playable-matches.util';
import { SerializedTournament } from './progression/serialize';
import { TournamentDocument } from './schemas/tournament.schema';
import { TournamentsService } from './tournaments.service';

@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  /**
   * POST /tournaments
   *
   * Creates a tournament AND generates its fixture/draw in the same request
   * (there is no separate "draw" endpoint — see draw/draw.service.ts).
   * `ownerId` is taken from the authenticated JWT user, never from the body.
   */
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(
    @Request() req: { user: UserDocument },
    @Body() dto: CreateTournamentDto,
  ): Promise<TournamentDocument> {
    const ownerId = (req.user._id as { toString(): string }).toString();
    return this.tournamentsService.create(ownerId, dto);
  }

  /**
   * GET /tournaments/:id
   *
   * Returns the tournament exactly as persisted — every derived value
   * (standings, ranks, bracket advancement, qualifiers, tournament state)
   * is computed and saved by the result PATCH, never by the frontend.
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(
    @Request() req: { user: UserDocument },
    @Param('id') id: string,
  ): Promise<SerializedTournament> {
    const ownerId = (req.user._id as { toString(): string }).toString();
    return this.tournamentsService.findOneForOwner(ownerId, id);
  }

  /**
   * GET /tournaments/:id/matches
   *
   * Lightweight view: only the matches that can be played right now, all
   * simultaneously (see progression/playable-matches.util.ts).
   */
  @UseGuards(JwtAuthGuard)
  @Get(':id/matches')
  getPlayableMatches(
    @Request() req: { user: UserDocument },
    @Param('id') id: string,
  ): Promise<PlayableMatchItem[]> {
    const ownerId = (req.user._id as { toString(): string }).toString();
    return this.tournamentsService.getPlayableMatches(ownerId, id);
  }

  /**
   * PATCH /tournaments/match/:matchId
   *
   * Records a single leg's result. `matchId` is globally unique so the
   * owning tournament is looked up directly from it (see
   * tournaments.service.ts). Everything downstream (standings, tiebreaks,
   * bracket advancement, Swiss pairing/play-in, stage transitions) is
   * computed and persisted here — the response is the full updated
   * tournament, same shape as `GET /tournaments/:id`.
   */
  @UseGuards(JwtAuthGuard)
  @Patch('match/:matchId')
  recordMatchResult(
    @Request() req: { user: UserDocument },
    @Param('matchId') matchId: string,
    @Body() dto: RecordMatchResultDto,
  ): Promise<SerializedTournament> {
    const ownerId = (req.user._id as { toString(): string }).toString();
    return this.tournamentsService.recordMatchResult(ownerId, matchId, dto);
  }
}
