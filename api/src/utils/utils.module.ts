import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ConsoleCatalog,
  ConsoleCatalogSchema,
} from './schemas/console-catalog.schema';
import {
  MatchModeCatalog,
  MatchModeCatalogSchema,
} from './schemas/match-mode-catalog.schema';
import { UtilsController } from './utils.controller';
import { UtilsService } from './utils.service';

/**
 * UtilsModule — read-only catalogs (consoles, match modes, tournament
 * format rules) consumed both by the frontend (see UtilsController) and by
 * other modules that need to validate a submitted `code` against the
 * catalog (see TournamentsModule, which imports this module to inject
 * `UtilsService` into `TournamentsService`).
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ConsoleCatalog.name, schema: ConsoleCatalogSchema },
      { name: MatchModeCatalog.name, schema: MatchModeCatalogSchema },
    ]),
  ],
  controllers: [UtilsController],
  providers: [UtilsService],
  exports: [UtilsService],
})
export class UtilsModule {}
