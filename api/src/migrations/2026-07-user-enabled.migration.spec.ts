import {
  MigratableUserCollection,
  migrateUserEnabled,
} from './2026-07-user-enabled.migration';

type RawDoc = Record<string, unknown>;

/**
 * Purpose-built, minimal in-memory fake of the exact MongoDB `Collection`
 * surface `migrateUserEnabled` uses (`updateMany` with an `$exists` filter
 * and a classic `{ $set }` update) — same style as the fake used in
 * `2026-07-user-state-last-signed-in.migration.spec.ts`.
 */
class FakeCollection implements MigratableUserCollection {
  constructor(private readonly docs: RawDoc[]) {}

  updateMany(
    filter: RawDoc,
    update: RawDoc,
  ): Promise<{ modifiedCount: number }> {
    const existsCondition = (
      filter.enabled as { $exists?: boolean } | undefined
    )?.$exists;
    const set = update.$set as RawDoc | undefined;

    let modifiedCount = 0;
    for (const doc of this.docs) {
      const exists = doc.enabled !== undefined;
      if (existsCondition !== undefined && exists !== existsCondition) {
        continue;
      }
      if (set) {
        for (const [key, value] of Object.entries(set)) {
          if (doc[key] !== value) {
            doc[key] = value;
            modifiedCount++;
          }
        }
      }
    }
    return Promise.resolve({ modifiedCount });
  }
}

interface FakeUserDoc {
  _id: string;
  enabled?: boolean;
}

function seedDocs(): FakeUserDoc[] {
  return [
    // Pre-existing legacy user: no `enabled` field yet.
    { _id: 'legacyNoEnabled' },
    // Already migrated / created after this change — must be a no-op,
    // regardless of the persisted value (e.g. a user disabled right before
    // the migration ran must NOT be silently re-enabled).
    { _id: 'alreadyEnabled', enabled: true },
    { _id: 'alreadyDisabled', enabled: false },
  ];
}

function findDoc(docs: FakeUserDoc[], id: string): FakeUserDoc {
  const found = docs.find((d) => d._id === id);
  if (!found) throw new Error(`fixture "${id}" not found`);
  return found;
}

describe('migrateUserEnabled', () => {
  it('defaults enabled=true on every user missing the field', async () => {
    const docs = seedDocs();
    await migrateUserEnabled(new FakeCollection(docs as unknown as RawDoc[]));

    expect(findDoc(docs, 'legacyNoEnabled').enabled).toBe(true);
  });

  it('never touches a user that already has enabled set, even to false', async () => {
    const docs = seedDocs();
    await migrateUserEnabled(new FakeCollection(docs as unknown as RawDoc[]));

    expect(findDoc(docs, 'alreadyEnabled').enabled).toBe(true);
    expect(findDoc(docs, 'alreadyDisabled').enabled).toBe(false);
  });

  it('reports the number of modified documents', async () => {
    const docs = seedDocs();
    const result = await migrateUserEnabled(
      new FakeCollection(docs as unknown as RawDoc[]),
    );

    expect(result.defaultedEnabled).toBe(1);
  });

  it('is idempotent: running it twice reports 0 changes the second time', async () => {
    const docs = seedDocs();
    const collection = new FakeCollection(docs as unknown as RawDoc[]);

    const firstRun = await migrateUserEnabled(collection);
    expect(firstRun.defaultedEnabled).toBeGreaterThan(0);

    const secondRun = await migrateUserEnabled(collection);
    expect(secondRun).toEqual({ defaultedEnabled: 0 });
  });
});
