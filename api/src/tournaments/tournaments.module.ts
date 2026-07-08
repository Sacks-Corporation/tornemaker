import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DrawService } from './draw/draw.service';
import { Tournament, TournamentSchema } from './schemas/tournament.schema';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

/**
 * TournamentsModule — persistence + fixture generation for tournaments.
 *
 * Registers the Tournament schema (which embeds teams, matches, groups,
 * standings, Swiss stage and knockout bracket — see
 * ./schemas/tournament.schema.ts for the full design rationale).
 *
 * `POST /tournaments` both persists the tournament AND generates its
 * fixture/draw in the same request; the draw logic lives under ./draw and
 * is exposed to the service via `DrawService`.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tournament.name, schema: TournamentSchema },
    ]),
  ],
  controllers: [TournamentsController],
  providers: [TournamentsService, DrawService],
})
export class TournamentsModule {}
