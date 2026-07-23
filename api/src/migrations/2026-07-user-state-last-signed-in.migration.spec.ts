import {
  MigratableUserCollection,
  migrateUserStateAndLastSignedIn,
} from './2026-07-user-state-last-signed-in.migration';

type RawDoc = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (isPlainObject(acc)) return acc[key];
    return undefined;
  }, obj);
}

function setPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  const keys = path.split('.');
  let cur: Record<string, unknown> = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i];
    const next = cur[key];
    if (isPlainObject(next)) {
      cur = next;
    } else {
      const created: Record<string, unknown> = {};
      cur[key] = created;
      cur = created;
    }
  }
  cur[keys[keys.length - 1]] = value;
}

/** Resolves a `$field` reference (aggregation-style) against a document. */
function resolveFieldRef(doc: RawDoc, ref: unknown): unknown {
  if (typeof ref === 'string' && ref.startsWith('$')) {
    return getPath(doc, ref.slice(1));
  }
  return ref;
}

function evalExpr(doc: RawDoc, expr: unknown): unknown {
  if (typeof expr === 'string' && expr.startsWith('$')) {
    return resolveFieldRef(doc, expr);
  }
  if (isPlainObject(expr)) {
    if ('$ne' in expr && Array.isArray(expr.$ne)) {
      const [a, b] = expr.$ne as [unknown, unknown];
      return (
        JSON.stringify(evalExpr(doc, a)) !== JSON.stringify(evalExpr(doc, b))
      );
    }
  }
  return expr;
}

function matchesFilter(doc: RawDoc, filter: RawDoc): boolean {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$expr') {
      return Boolean(evalExpr(doc, condition));
    }
    const value = getPath(doc, key);
    if (isPlainObject(condition) && '$exists' in condition) {
      const exists = value !== undefined;
      return condition.$exists === exists;
    }
    return value === condition;
  });
}

/**
 * Purpose-built, minimal in-memory fake of the exact MongoDB `Collection`
 * surface `migrateUserStateAndLastSignedIn` uses (`updateMany` with
 * `$exists`/`$expr` filters, classic `{ $set }` updates, and
 * aggregation-pipeline `[{ $set }]` updates that copy one field's value into
 * another via `$field` references) — NOT a general-purpose Mongo emulator,
 * just enough to unit-test this migration's logic (including idempotency)
 * without a real MongoDB instance.
 */
class FakeCollection implements MigratableUserCollection {
  constructor(private readonly docs: RawDoc[]) {}

  updateMany(
    filter: RawDoc,
    update: RawDoc | RawDoc[],
  ): Promise<{ modifiedCount: number }> {
    let modifiedCount = 0;
    const stages = Array.isArray(update) ? update : [update];

    for (const doc of this.docs) {
      if (!matchesFilter(doc, filter)) continue;
      let modified = false;

      for (const stage of stages) {
        const set = stage.$set;
        if (!isPlainObject(set)) continue;
        for (const [path, rawValue] of Object.entries(set)) {
          const value = resolveFieldRef(doc, rawValue);
          if (JSON.stringify(getPath(doc, path)) !== JSON.stringify(value)) {
            setPath(doc, path, value);
            modified = true;
          }
        }
      }

      if (modified) modifiedCount++;
    }

    return Promise.resolve({ modifiedCount });
  }
}

// --- Test fixtures ----------------------------------------------------------

interface FakeUserDoc {
  _id: string;
  createdAt: string;
  updatedAt: string;
  state?: string;
  lastSignedIn?: string;
}

function seedDocs(): FakeUserDoc[] {
  return [
    // 1. Pre-existing legacy user: no `state`, no `lastSignedIn`, and
    //    `updatedAt` drifted from `createdAt` (e.g. Google-linking touched
    //    it back when timestamps were still auto-managed on every write).
    {
      _id: 'legacyDrifted',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-02-15T00:00:00.000Z',
    },
    // 2. Pre-existing user whose `updatedAt` already happens to equal
    //    `createdAt` (never touched after creation), but still missing the
    //    new fields.
    {
      _id: 'legacyAligned',
      createdAt: '2026-03-01T00:00:00.000Z',
      updatedAt: '2026-03-01T00:00:00.000Z',
    },
    // 3. Already fully migrated / created after this change — must be a
    //    complete no-op.
    {
      _id: 'alreadyMigrated',
      createdAt: '2026-07-01T00:00:00.000Z',
      updatedAt: '2026-07-01T00:00:00.000Z',
      state: 'ACTIVE',
      lastSignedIn: '2026-07-01T00:00:00.000Z',
    },
  ];
}

function toCollection(docs: FakeUserDoc[]): FakeCollection {
  return new FakeCollection(docs as unknown as RawDoc[]);
}

function findDoc(docs: FakeUserDoc[], id: string): FakeUserDoc {
  const found = docs.find((d) => d._id === id);
  if (!found) throw new Error(`fixture "${id}" not found`);
  return found;
}

describe('migrateUserStateAndLastSignedIn', () => {
  it('defaults state=ACTIVE on every user missing the field', async () => {
    const docs = seedDocs();
    await migrateUserStateAndLastSignedIn(toCollection(docs));

    expect(findDoc(docs, 'legacyDrifted').state).toBe('ACTIVE');
    expect(findDoc(docs, 'legacyAligned').state).toBe('ACTIVE');
    // Already had state explicitly set -> untouched.
    expect(findDoc(docs, 'alreadyMigrated').state).toBe('ACTIVE');
  });

  it('backfills lastSignedIn from createdAt on every user missing the field', async () => {
    const docs = seedDocs();
    await migrateUserStateAndLastSignedIn(toCollection(docs));

    expect(findDoc(docs, 'legacyDrifted').lastSignedIn).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    expect(findDoc(docs, 'legacyAligned').lastSignedIn).toBe(
      '2026-03-01T00:00:00.000Z',
    );
    // Already had lastSignedIn explicitly set -> untouched.
    expect(findDoc(docs, 'alreadyMigrated').lastSignedIn).toBe(
      '2026-07-01T00:00:00.000Z',
    );
  });

  it('backfills updatedAt to match createdAt only where they differ', async () => {
    const docs = seedDocs();
    await migrateUserStateAndLastSignedIn(toCollection(docs));

    // Drifted -> corrected to match createdAt.
    expect(findDoc(docs, 'legacyDrifted').updatedAt).toBe(
      '2026-01-01T00:00:00.000Z',
    );
    // Already aligned -> left as-is (same value either way).
    expect(findDoc(docs, 'legacyAligned').updatedAt).toBe(
      '2026-03-01T00:00:00.000Z',
    );
    expect(findDoc(docs, 'alreadyMigrated').updatedAt).toBe(
      '2026-07-01T00:00:00.000Z',
    );
  });

  it('never touches an already-migrated user', async () => {
    const docs = seedDocs();
    const before = JSON.parse(
      JSON.stringify(findDoc(docs, 'alreadyMigrated')),
    ) as FakeUserDoc;

    await migrateUserStateAndLastSignedIn(toCollection(docs));

    expect(findDoc(docs, 'alreadyMigrated')).toEqual(before);
  });

  it('is idempotent: running it twice reports 0 changes the second time and leaves an identical final state', async () => {
    const docs = seedDocs();
    const collection = toCollection(docs);

    const firstRun = await migrateUserStateAndLastSignedIn(collection);
    expect(firstRun.defaultedState).toBeGreaterThan(0);
    expect(firstRun.backfilledLastSignedIn).toBeGreaterThan(0);
    expect(firstRun.backfilledUpdatedAt).toBeGreaterThan(0);

    const stateAfterFirstRun = JSON.parse(JSON.stringify(docs)) as unknown;

    const secondRun = await migrateUserStateAndLastSignedIn(collection);
    expect(secondRun).toEqual({
      defaultedState: 0,
      backfilledLastSignedIn: 0,
      backfilledUpdatedAt: 0,
    });

    expect(JSON.parse(JSON.stringify(docs)) as unknown).toEqual(
      stateAfterFirstRun,
    );
  });
});
