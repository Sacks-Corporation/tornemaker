import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AppModule } from '../app.module';
import { User, UserDocument } from '../users/schemas/user.schema';

const logger = new Logger('UserEnabledMigration');

/**
 * Minimal shape of a MongoDB `Collection` this migration needs — just
 * `updateMany`, so the core logic below (`migrateUserEnabled`) can be
 * unit-tested against a lightweight fake instead of a real MongoDB instance.
 * `Model.collection` (the native driver collection underneath a Mongoose
 * model) satisfies this directly — same pattern as
 * `2026-07-user-state-last-signed-in.migration.ts`.
 */
export interface MigratableUserCollection {
  updateMany(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
  ): Promise<{ modifiedCount: number }>;
}

export interface UserEnabledMigrationResult {
  defaultedEnabled: number;
}

/**
 * Idempotent data migration backfilling the new `User.enabled` field (see
 * `users/schemas/user.schema.ts`) on users created before this change: sets
 * `enabled: true` on every user document that doesn't already have the
 * field, matching the schema's own default for every NEW user going forward
 * (`UsersService.createLocalUser` / `findOrCreateFromGoogle` rely on that
 * default rather than setting it explicitly). Safe to run any number of
 * times: the filter only matches documents still missing the field, so a
 * second run always reports `0`.
 */
export async function migrateUserEnabled(
  collection: MigratableUserCollection,
): Promise<UserEnabledMigrationResult> {
  const result = await collection.updateMany(
    { enabled: { $exists: false } },
    { $set: { enabled: true } },
  );

  return { defaultedEnabled: result.modifiedCount };
}

/** CLI entrypoint — `npm run migrate:user-enabled` (see package.json). */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const userModel = app.get<Model<UserDocument>>(getModelToken(User.name));
    const result = await migrateUserEnabled(userModel.collection);
    logger.log(`Defaulted enabled=true on ${result.defaultedEnabled} user(s)`);
    logger.log('Migration complete.');
  } finally {
    await app.close();
  }
}

// Only run the CLI entrypoint when this file is executed directly (e.g. via
// `npm run migrate:user-enabled`), never when imported by tests.
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
