import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from '../admins/schemas/admin.schema';
import { AppModule } from '../app.module';

const logger = new Logger('SeedInitialAdminMigration');

const SALT_ROUNDS = 10;

export const INITIAL_ADMIN_EMAIL = 'admin@tornemaker.com';

/**
 * Plain-text password lives ONLY here, in the seed script — never in the
 * `Admin` schema, `AdminsService`, or any controller. It is bcrypt-hashed
 * below before ever being persisted.
 */
const INITIAL_ADMIN_PASSWORD = 'Tornemaker2799';

/**
 * Minimal shape of a MongoDB `Collection` this seed needs — `findOne` (to
 * check idempotently) and `insertOne` — so the core logic below
 * (`seedInitialAdmin`) can be unit-tested against a lightweight fake instead
 * of a real MongoDB instance. `Model.collection` (the native driver
 * collection underneath a Mongoose model) satisfies this directly.
 */
export interface SeedableAdminCollection {
  findOne(
    filter: Record<string, unknown>,
  ): Promise<Record<string, unknown> | null>;
  insertOne(doc: Record<string, unknown>): Promise<unknown>;
}

export interface SeedInitialAdminResult {
  created: boolean;
}

/**
 * Idempotent seed for the initial backoffice admin account: inserts the
 * admin (default `admin@tornemaker.com` / bcrypt hash of
 * `Tornemaker2799`) only if no admin with that email exists yet. Safe to
 * run any number of times — a second run always reports `created: false`.
 */
export async function seedInitialAdmin(
  collection: SeedableAdminCollection,
  email: string = INITIAL_ADMIN_EMAIL,
  plainPassword: string = INITIAL_ADMIN_PASSWORD,
): Promise<SeedInitialAdminResult> {
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await collection.findOne({ email: normalizedEmail });
  if (existing) {
    return { created: false };
  }

  const passwordHash = await bcrypt.hash(plainPassword, SALT_ROUNDS);
  const now = new Date();
  await collection.insertOne({
    email: normalizedEmail,
    password: passwordHash,
    createdAt: now,
    updatedAt: now,
  });

  return { created: true };
}

/** CLI entrypoint — `npm run seed:admin` (see package.json). */
async function main(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  try {
    const adminModel = app.get<Model<AdminDocument>>(getModelToken(Admin.name));
    const result = await seedInitialAdmin(adminModel.collection);
    if (result.created) {
      logger.log(`Created initial admin (${INITIAL_ADMIN_EMAIL})`);
    } else {
      logger.log(
        `Initial admin (${INITIAL_ADMIN_EMAIL}) already exists — skipped`,
      );
    }
    logger.log('Seed complete.');
  } finally {
    await app.close();
  }
}

// Only run the CLI entrypoint when this file is executed directly (e.g. via
// `npm run seed:admin`), never when imported by tests.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err: unknown) => {
      logger.error(
        'Seed failed',
        err instanceof Error ? err.stack : String(err),
      );
      process.exit(1);
    });
}
