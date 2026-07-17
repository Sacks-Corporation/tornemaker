import {
  MigratableCollection,
  migrateTeamCountDynamic,
} from './2026-07-team-count-dynamic.migration';

type RawDoc = Record<string, unknown>;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (isPlainObject(acc)) return acc[key];
    if (Array.isArray(acc)) {
      const index = Number(key);
      return Number.isNaN(index) ? undefined : (acc as unknown[])[index];
    }
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

function deletePath(obj: Record<string, unknown>, path: string): void {
  const keys = path.split('.');
  let cur: unknown = obj;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!isPlainObject(cur)) return;
    cur = cur[keys[i]];
  }
  if (!isPlainObject(cur)) return;
  delete cur[keys[keys.length - 1]];
}

function matchesClause(
  doc: RawDoc,
  field: string,
  condition: unknown,
): boolean {
  const value = getPath(doc, field);
  if (isPlainObject(condition)) {
    if ('$exists' in condition) {
      const exists = value !== undefined;
      if (condition.$exists !== exists) return false;
    }
    if ('$ne' in condition) {
      if (value === condition.$ne) return false;
    }
    return true;
  }
  return value === condition;
}

function matchesFilter(doc: RawDoc, filter: RawDoc): boolean {
  return Object.entries(filter).every(([key, condition]) => {
    if (key === '$or' && Array.isArray(condition)) {
      return (condition as RawDoc[]).some((clause) =>
        matchesFilter(doc, clause),
      );
    }
    return matchesClause(doc, key, condition);
  });
}

/**
 * Purpose-built, minimal in-memory fake of the exact MongoDB `Collection`
 * surface `migrateTeamCountDynamic` uses (`updateMany` with `$exists`/`$ne`/
 * `$or` filters and `$rename`/`$set` updates) — NOT a general-purpose Mongo
 * emulator, just enough to unit-test this migration's logic (including
 * idempotency) without a real MongoDB instance.
 */
class FakeCollection implements MigratableCollection {
  constructor(private readonly docs: RawDoc[]) {}

  updateMany(
    filter: RawDoc,
    update: RawDoc,
  ): Promise<{ modifiedCount: number }> {
    let modifiedCount = 0;

    for (const doc of this.docs) {
      if (!matchesFilter(doc, filter)) continue;
      let modified = false;

      const rename = update.$rename;
      if (isPlainObject(rename)) {
        for (const [from, to] of Object.entries(rename)) {
          const value = getPath(doc, from);
          if (value !== undefined && typeof to === 'string') {
            setPath(doc, to, value);
            deletePath(doc, from);
            modified = true;
          }
        }
      }

      const set = update.$set;
      if (isPlainObject(set)) {
        for (const [path, value] of Object.entries(set)) {
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

// --- Test fixtures (typed, so assertions below need no `any`) --------------

interface FakeGroupStage {
  groupCap?: number;
  groupSize?: number;
  groups: unknown[];
  bestThirdPlaceSlots: number;
  qualifiedThirdPlaceTeamIds: string[];
}

interface FakeTournamentDoc {
  _id: string;
  format: string;
  aiFill?: boolean;
  groupStage?: FakeGroupStage;
  knockoutStage?: { bracket: { drawSize: number } };
}

function seedDocs(): FakeTournamentDoc[] {
  return [
    // 1. Still mid-groups (no bracket yet): legacy groupSize + non-zero
    //    best-third fields that must be reset so the new logic takes over.
    {
      _id: 'inProgressGroups',
      format: 'GROUP_STAGE_PLUS_ELIMINATION',
      groupStage: {
        groupSize: 4,
        groups: [],
        bestThirdPlaceSlots: 2,
        qualifiedThirdPlaceTeamIds: ['teamA', 'teamB'],
      },
    },
    // 2. Bracket ALREADY built (in progress or finished): only the field
    //    rename applies — historical bestThirdPlaceSlots/qualifiedThirdPlaceTeamIds
    //    must be left exactly as they were.
    {
      _id: 'alreadyBracketed',
      format: 'GROUP_STAGE_PLUS_ELIMINATION',
      groupStage: {
        groupSize: 3,
        groups: [],
        bestThirdPlaceSlots: 2,
        qualifiedThirdPlaceTeamIds: ['teamX'],
      },
      knockoutStage: { bracket: { drawSize: 8 } },
    },
    // 3. A format without any groupStage at all — only aiFill defaulting applies.
    {
      _id: 'singleElimination',
      format: 'SINGLE_ELIMINATION',
      knockoutStage: { bracket: { drawSize: 8 } },
    },
    // 4. Already fully migrated / created after this change — must be a no-op.
    {
      _id: 'alreadyNew',
      format: 'GROUP_STAGE_PLUS_ELIMINATION',
      aiFill: true,
      groupStage: {
        groupCap: 4,
        groups: [],
        bestThirdPlaceSlots: 0,
        qualifiedThirdPlaceTeamIds: [],
      },
    },
  ];
}

function toCollection(docs: FakeTournamentDoc[]): FakeCollection {
  return new FakeCollection(docs as unknown as RawDoc[]);
}

function findDoc(docs: FakeTournamentDoc[], id: string): FakeTournamentDoc {
  const found = docs.find((d) => d._id === id);
  if (!found) throw new Error(`fixture "${id}" not found`);
  return found;
}

describe('migrateTeamCountDynamic', () => {
  it('renames groupSize -> groupCap on every group-stage tournament, bracketed or not', async () => {
    const docs = seedDocs();
    await migrateTeamCountDynamic(toCollection(docs));

    const inProgress = findDoc(docs, 'inProgressGroups');
    expect(inProgress.groupStage?.groupCap).toBe(4);
    expect(inProgress.groupStage?.groupSize).toBeUndefined();

    const bracketed = findDoc(docs, 'alreadyBracketed');
    expect(bracketed.groupStage?.groupCap).toBe(3);
    expect(bracketed.groupStage?.groupSize).toBeUndefined();
  });

  it('defaults aiFill=false on every tournament missing the field, regardless of format', async () => {
    const docs = seedDocs();
    await migrateTeamCountDynamic(toCollection(docs));

    expect(findDoc(docs, 'inProgressGroups').aiFill).toBe(false);
    expect(findDoc(docs, 'alreadyBracketed').aiFill).toBe(false);
    expect(findDoc(docs, 'singleElimination').aiFill).toBe(false);
    // Already had aiFill explicitly set -> untouched.
    expect(findDoc(docs, 'alreadyNew').aiFill).toBe(true);
  });

  it('resets bestThirdPlaceSlots/qualifiedThirdPlaceTeamIds ONLY for group-stage tournaments with no bracket yet', async () => {
    const docs = seedDocs();
    await migrateTeamCountDynamic(toCollection(docs));

    const inProgress = findDoc(docs, 'inProgressGroups');
    expect(inProgress.groupStage?.bestThirdPlaceSlots).toBe(0);
    expect(inProgress.groupStage?.qualifiedThirdPlaceTeamIds).toEqual([]);

    // Bracket already exists -> historical values left exactly as they were.
    const bracketed = findDoc(docs, 'alreadyBracketed');
    expect(bracketed.groupStage?.bestThirdPlaceSlots).toBe(2);
    expect(bracketed.groupStage?.qualifiedThirdPlaceTeamIds).toEqual(['teamX']);
  });

  it('never touches an already-migrated tournament', async () => {
    const docs = seedDocs();
    const before = JSON.parse(
      JSON.stringify(findDoc(docs, 'alreadyNew')),
    ) as FakeTournamentDoc;

    await migrateTeamCountDynamic(toCollection(docs));

    expect(findDoc(docs, 'alreadyNew')).toEqual(before);
  });

  it('is idempotent: running it twice reports 0 changes the second time and leaves an identical final state', async () => {
    const docs = seedDocs();
    const collection = toCollection(docs);

    const firstRun = await migrateTeamCountDynamic(collection);
    expect(firstRun.renamedGroupCap).toBeGreaterThan(0);
    expect(firstRun.defaultedAiFill).toBeGreaterThan(0);
    expect(firstRun.resetBestThirdPlaceSlots).toBeGreaterThan(0);

    const stateAfterFirstRun = JSON.parse(JSON.stringify(docs)) as unknown;

    const secondRun = await migrateTeamCountDynamic(collection);
    expect(secondRun).toEqual({
      renamedGroupCap: 0,
      defaultedAiFill: 0,
      resetBestThirdPlaceSlots: 0,
    });

    expect(JSON.parse(JSON.stringify(docs)) as unknown).toEqual(
      stateAfterFirstRun,
    );
  });
});
