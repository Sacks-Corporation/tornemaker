import * as bcrypt from 'bcrypt';
import {
  SeedableAdminCollection,
  seedInitialAdmin,
} from './2026-07-seed-initial-admin.migration';

interface FakeAdminDoc {
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Purpose-built, minimal in-memory fake of the exact MongoDB `Collection`
 * surface `seedInitialAdmin` uses (`findOne` + `insertOne`) — just enough to
 * unit-test this seed's idempotency without a real MongoDB instance.
 */
class FakeCollection implements SeedableAdminCollection {
  constructor(private readonly docs: FakeAdminDoc[] = []) {}

  findOne(filter: Record<string, unknown>): Promise<FakeAdminDoc | null> {
    const email = filter.email as string;
    return Promise.resolve(
      this.docs.find((doc) => doc.email === email) ?? null,
    );
  }

  insertOne(doc: Record<string, unknown>): Promise<unknown> {
    this.docs.push(doc as unknown as FakeAdminDoc);
    return Promise.resolve({ acknowledged: true });
  }

  all(): FakeAdminDoc[] {
    return this.docs;
  }
}

describe('seedInitialAdmin', () => {
  it('creates the admin with a bcrypt-hashed password when none exists yet', async () => {
    const collection = new FakeCollection();

    const result = await seedInitialAdmin(
      collection,
      'admin@tornemaker.com',
      'Tornemaker2799',
    );

    expect(result.created).toBe(true);
    expect(collection.all()).toHaveLength(1);

    const stored = collection.all()[0];
    expect(stored.email).toBe('admin@tornemaker.com');
    expect(stored.password).not.toBe('Tornemaker2799');
    await expect(
      bcrypt.compare('Tornemaker2799', stored.password),
    ).resolves.toBe(true);
  });

  it('normalizes the email to lowercase/trimmed before storing', async () => {
    const collection = new FakeCollection();

    await seedInitialAdmin(collection, '  Admin@Tornemaker.com  ', 'secret1A');

    expect(collection.all()[0].email).toBe('admin@tornemaker.com');
  });

  it('is idempotent: running it twice never duplicates the admin', async () => {
    const collection = new FakeCollection();

    const first = await seedInitialAdmin(
      collection,
      'admin@tornemaker.com',
      'Tornemaker2799',
    );
    expect(first.created).toBe(true);

    const second = await seedInitialAdmin(
      collection,
      'admin@tornemaker.com',
      'Tornemaker2799',
    );
    expect(second.created).toBe(false);

    expect(collection.all()).toHaveLength(1);
  });
});
