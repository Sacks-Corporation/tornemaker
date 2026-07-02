import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Tournament, TournamentSchema } from './schemas/tournament.schema';

/**
 * TournamentsModule — metadata and persistence for tournaments.
 *
 * The internal structure (participants, brackets, matches, results, etc.) is
 * not yet modeled — it will be defined once the team specifies the tournament
 * format(s). This module currently registers the schema only.
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tournament.name, schema: TournamentSchema },
    ]),
  ],
})
export class TournamentsModule {}
