import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import {
  Tournament,
  TournamentDocument,
} from '../tournaments/schemas/tournament.schema';

const logger = new Logger('TeamCountDynamicMigration');

/**
 * Minimal shape of a MongoDB `Collection` this migration needs — just
 * `updateMany`, so the core logic below (`migrateTeamCountDynamic`) can be
 * unit-tested against a lightweight fake instead of a real MongoDB instance.
 * `Model.collection` (the native driver collection underneath a Mongoose
 * model) satisfies this directly.
 */
export interface MigratableCollection {
  updateMany(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<{ modifiedCount: number }>;
}

export interface TeamCountDynamicMigrationResult {
  renamedGroupCap: number;
  defaultedAiFill: number;
  resetBestThirdPlaceSlots: number;
}

/**
 * Idempotent data migration for the "dynamic team count" change (see
 * `tournaments/dto/format-rules.ts`). Safe to run any number of times: every
 * step's filter only matches documents that still need that particular
 * change, so a second run always reports `0` for everything.
 *
 * Talks to the raw MongoDB `Collection` (NOT the typed Mongoose `Model`) on
 * purpose: the fields being renamed/removed (`groupStage.groupSize`,
 * historical non-zero `groupStage.bestThirdPlaceSlots`) no longer exist on
 * the current `GroupStage` TypeScript schema, so they're unreachable through
 * the strongly-typed Mongoose API — this is exactly the kind of raw,
 * schema-agnostic update the official Mongoose/MongoDB driver is meant for.
 *
 * Three independent steps, each documented on why it's safe/needed:
 *
 *   1. `groupStage.groupSize` -> `groupStage.groupCap` (rename). Applied to
 *      EVERY GROUP_STAGE_PLUS_ELIMINATION tournament regardless of how far
 *      it has progressed (including FINISHED ones): `POST /tournaments/:id/reset`
 *      reads `groupStage.groupCap` even for a finished tournament, so the
 *      rename must apply everywhere the old field exists, not just to
 *      still-in-progress ones. This is the ONLY change applied to
 *      tournaments whose knockout bracket already exists / that are
 *      FINISHED — their matches/results are left completely untouched.
 *
 *   2. `aiFill` defaults to `false` on every tournament created before this
 *      field existed (every tournament predates it, since it didn't exist
 *      before this change) — purely additive, never overwrites an existing
 *      value.
 *
 *   3. `groupStage.bestThirdPlaceSlots` -> `0` and
 *      `groupStage.qualifiedThirdPlaceTeamIds` -> `[]`, but ONLY for
 *      GROUP_STAGE_PLUS_ELIMINATION tournaments whose knockout bracket has
 *      NOT been built yet (`knockoutStage` absent — i.e. still mid-groups).
 *      This is what makes `MatchProgressionService.finishGroupStage` (which
 *      no longer computes/consumes best-thirds at all — see
 *      `progression/knockout-seeding.util.ts`) close the bracket correctly
 *      with "top 2 of every group + byes" once those groups finish, instead
 *      of leaving a stale non-zero slot count lying around from before this
 *      change. Tournaments whose bracket ALREADY exists (in progress or
 *      finished) are deliberately excluded — their bracket was already
 *      built (possibly using the old best-thirds logic) and is left as-is,
 *      per the "don't touch already-built brackets" rule.
 */
export async function migrateTeamCountDynamic(
  collection: MigratableCollection,
): Promise<TeamCountDynamicMigrationResult> {
  const renameResult = await collection.updateMany(
    { 'groupStage.groupSize': { $exists: true } },
    { $rename: { 'groupStage.groupSize': 'groupStage.groupCap' } },
  );

  const aiFillResult = await collection.updateMany(
    { aiFill: { $exists: false } },
    { $set: { aiFill: false } },
  );

  const bestThirdResult = await collection.updateMany(
    {
      groupStage: { $exists: true },
      knockoutStage: { $exists: false },
      $or: [
        { 'groupStage.bestThirdPlaceSlots': { $ne: 0 } },
        { 'groupStage.qualifiedThirdPlaceTeamIds.0': { $exists: true } },
      ],
    },
    {
      $set: {
        'groupStage.bestThirdPlaceSlots': 0,
        'groupStage.qualifiedThirdPlaceTeamIds': [],
      },
    },
  );

  return {
    renamedGroupCap: renameResult.modifiedCount,
    defaultedAiFill: aiFillResult.modifiedCount,
    resetBestThirdPlaceSlots: bestThirdResult.modifiedCount,
  };
}

/** CLI entrypoint — `npm run migrate:team-count-dynamic` (see package.json). */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const tournamentModel = app.get<Model<TournamentDocument>>(
      getModelToken(Tournament.name),
    );
    const result = await migrateTeamCountDynamic(tournamentModel.collection);
    logger.log(
      `Renamed groupStage.groupSize -> groupStage.groupCap on ${result.renamedGroupCap} tournament(s)`,
    );
    logger.log(
      `Defaulted aiFill=false on ${result.defaultedAiFill} tournament(s)`,
    );
    logger.log(
      `Reset bestThirdPlaceSlots/qualifiedThirdPlaceTeamIds on ${result.resetBestThirdPlaceSlots} not-yet-bracketed group-stage tournament(s)`,
    );
    logger.log('Migration complete.');
  } finally {
    await app.close();
  }
}

// Only run the CLI entrypoint when this file is executed directly (e.g. via
// `npm run migrate:team-count-dynamic`), never when imported by tests.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      logger.error(
        'Migration failed',
        err instanceof Error ? err.stack : String(err),
      );
      process.exit(1);
    });
}
