import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { UserDocument } from '../users/schemas/user.schema';
import { CreateTournamentDto } from './dto/create-tournament.dto';
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
}
