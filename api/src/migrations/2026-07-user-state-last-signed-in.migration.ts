import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { User, UserDocument } from '../users/schemas/user.schema';

const logger = new Logger('UserStateLastSignedInMigration');

/**
 * Minimal shape of a MongoDB `Collection` this migration needs — just
 * `updateMany`, so the core logic below (`migrateUserStateAndLastSignedIn`)
 * can be unit-tested against a lightweight fake instead of a real MongoDB
 * instance. `Model.collection` (the native driver collection underneath a
 * Mongoose model) satisfies this directly.
 *
 * `update` accepts either a classic update document (`{ $set: ... }`) or an
 * aggregation-pipeline update (`[{ $set: ... }]`, MongoDB >= 4.2) — the
 * latter is what lets `$set` copy one existing field's value into another
 * (e.g. `lastSignedIn` <- `createdAt`), which a plain update document cannot
 * express. Talking to the raw `Collection` (not the typed Mongoose `Model`)
 * is what makes the pipeline form available here in the first place.
 */
export interface MigratableUserCollection {
  updateMany(
    filter: Record<string, unknown>,
    update: Record<string, unknown> | Record<string, unknown>[],
  ): Promise<{ modifiedCount: number }>;
}

export interface UserStateLastSignedInMigrationResult {
  defaultedState: number;
  backfilledLastSignedIn: number;
  backfilledUpdatedAt: number;
}

/**
 * Idempotent data migration backfilling the new `User.state` and
 * `User.lastSignedIn` fields (see `users/schemas/user.schema.ts` and
 * `users/schemas/user-state.enum.ts`) on users created before this change.
 * Safe to run any number of times: every step's filter only matches
 * documents that still need that particular change, so a second run always
 * reports `0` for everything.
 *
 * Three independent steps:
 *
 *   1. `state` defaults to `ACTIVE` wherever missing — the only state any
 *      user has ever had so far (`BLOCKED`/`INACTIVE` are not written by any
 *      code path yet), so this is a safe, purely additive default.
 *
 *   2. `lastSignedIn` is backfilled from `createdAt` wherever missing, so
 *      existing users end up with the same "aligned with createdAt at
 *      creation time" invariant that `UsersService.createLocalUser` /
 *      `findOrCreateFromGoogle` establish for new users going forward.
 *
 *   3. `updatedAt` is backfilled to equal `createdAt` wherever they differ.
 *      This is needed because, before `UsersService.touchLastSignedIn`
 *      existed, plain Mongoose updates (e.g. linking a Google identity to an
 *      existing local account in `findByGoogleIdentity`) bumped `updatedAt`
 *      via the schema's `{ timestamps: true }`. Since there is no profile
 *      editing yet, every user's `updatedAt` is expected to equal
 *      `createdAt` going forward (logins now go through
 *      `touchLastSignedIn`, which explicitly opts out of touching
 *      `updatedAt`) — this step brings existing users in line with that.
 *      Uses `$expr` to compare the two fields directly in the filter, so a
 *      second run (where they already match) reports `0`.
 */
export async function migrateUserStateAndLastSignedIn(
  collection: MigratableUserCollection,
): Promise<UserStateLastSignedInMigrationResult> {
  const stateResult = await collection.updateMany(
    { state: { $exists: false } },
    { $set: { state: 'ACTIVE' } },
  );

  const lastSignedInResult = await collection.updateMany(
    { lastSignedIn: { $exists: false } },
    [{ $set: { lastSignedIn: '$createdAt' } }],
  );

  const updatedAtResult = await collection.updateMany(
    { $expr: { $ne: ['$updatedAt', '$createdAt'] } },
    [{ $set: { updatedAt: '$createdAt' } }],
  );

  return {
    defaultedState: stateResult.modifiedCount,
    backfilledLastSignedIn: lastSignedInResult.modifiedCount,
    backfilledUpdatedAt: updatedAtResult.modifiedCount,
  };
}

/** CLI entrypoint — `npm run migrate:user-state-last-signed-in` (see package.json). */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const result = await migrateUserStateAndLastSignedIn(userModel.collection);
    logger.log(`Defaulted state=ACTIVE on ${result.defaultedState} user(s)`);
    logger.log(
      `Backfilled lastSignedIn from createdAt on ${result.backfilledLastSignedIn} user(s)`,
    );
    logger.log(
      `Backfilled updatedAt to match createdAt on ${result.backfilledUpdatedAt} user(s)`,
    );
    logger.log('Migration complete.');
  } finally {
    await app.close();
  }
}

// Only run the CLI entrypoint when this file is executed directly (e.g. via
// `npm run migrate:user-state-last-signed-in`), never when imported by tests.
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
