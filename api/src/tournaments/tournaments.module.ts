import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tournament, TournamentSchema } from './schemas/tournament.schema';

/**
 * TournamentsModule — persistence for tournaments.
 *
 * Registers the Tournament schema (which embeds teams, matches, groups,
 * standings, Swiss stage and knockout bracket — see
 * ./schemas/tournament.schema.ts for the full design rationale).
 * Controllers/services/DTOs for CRUD and fixture generation are added in a
 * follow-up once the data model above is validated.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tournament.name, schema: TournamentSchema },
    ]),
  ],
})
export class TournamentsModule {}
