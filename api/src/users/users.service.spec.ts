import { Model, Types } from 'mongoose';
import { PaginationQueryDto, SortDirection } from '../common/pagination';
import { UserDocument } from './schemas/user.schema';
import { UserState } from './schemas/user-state.enum';
import { UsersService } from './users.service';

/** Minimal fake of the chainable `find(...).select().sort().skip().limit().exec()`
 *  surface `findAllPaginated` uses — every link returns the same chain
 *  object so calls can be composed in any order, mirroring how Mongoose's
 *  real `Query` builder behaves. */
function makeFindChain(result: UserDocument[]) {
  const chain = {
    select: jest.fn(),
    sort: jest.fn(),
    skip: jest.fn(),
    limit: jest.fn(),
    exec: jest.fn().mockResolvedValue(result),
  };
  chain.select.mockReturnValue(chain);
  chain.sort.mockReturnValue(chain);
  chain.skip.mockReturnValue(chain);
  chain.limit.mockReturnValue(chain);
  return chain;
}

function makeModel(docs: UserDocument[], total: number) {
  const findChain = makeFindChain(docs);
  const find = jest.fn().mockReturnValue(findChain);
  const countExec = jest.fn().mockResolvedValue(total);
  const countDocuments = jest.fn().mockReturnValue({ exec: countExec });
  const model = { find, countDocuments } as unknown as Model<UserDocument>;
  return { model, find, findChain, countDocuments };
}

function fakeUserDoc(overrides: Partial<UserDocument> = {}): UserDocument {
  return {
    _id: new Types.ObjectId(),
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    provider: 'local',
    state: UserState.ACTIVE,
    lastSignedIn: new Date('2026-07-20T00:00:00.000Z'),
    updatedAt: new Date('2026-07-21T00:00:00.000Z'),
    ...overrides,
  } as unknown as UserDocument;
}

describe('UsersService.findAllPaginated', () => {
  it('returns the exact { data, total, page, pageSize } contract', async () => {
    const docs = [fakeUserDoc(), fakeUserDoc()];
    const { model } = makeModel(docs, 42);
    const service = new UsersService(model);

    const query = {
      page: 2,
      pageSize: 7,
      sortField: 'createdAt',
      sortDirection: SortDirection.DESC,
    } as PaginationQueryDto;
    const result = await service.findAllPaginated(query);

    expect(result.total).toBe(42);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(7);
    expect(result.data).toHaveLength(2);
  });

  it('applies skip/limit for the requested page/pageSize (page 2, pageSize 7 -> records 8-14 -> skip 7, limit 7)', async () => {
    const { model, findChain } = makeModel([], 0);
    const service = new UsersService(model);

    await service.findAllPaginated({
      page: 2,
      pageSize: 7,
    } as PaginationQueryDto);

    expect(findChain.skip).toHaveBeenCalledWith(7);
    expect(findChain.limit).toHaveBeenCalledWith(7);
  });

  it('defaults to createdAt desc when sortField is absent', async () => {
    const { model, findChain } = makeModel([], 0);
    const service = new UsersService(model);

    await service.findAllPaginated({
      page: 1,
      pageSize: 20,
    } as PaginationQueryDto);

    expect(findChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('falls back to createdAt desc when sortField is not in the whitelist (e.g. "state", which is computed, or an unknown field)', async () => {
    const { model, findChain } = makeModel([], 0);
    const service = new UsersService(model);

    await service.findAllPaginated({
      page: 1,
      pageSize: 20,
      sortField: 'state',
    } as PaginationQueryDto);

    expect(findChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  describe('sorting', () => {
    const cases: Array<{
      sortField: string;
      dbSort: Record<string, 1 | -1>;
    }> = [
      { sortField: 'name', dbSort: { firstName: 1, lastName: 1 } },
      { sortField: 'email', dbSort: { email: 1 } },
      { sortField: 'createdAt', dbSort: { createdAt: 1 } },
      { sortField: 'updatedAt', dbSort: { updatedAt: 1 } },
      { sortField: 'lastSignedIn', dbSort: { lastSignedIn: 1 } },
      { sortField: 'provider', dbSort: { provider: 1 } },
    ];

    it.each(cases)(
      'sorts by $sortField ascending',
      async ({ sortField, dbSort }) => {
        const { model, findChain } = makeModel([], 0);
        const service = new UsersService(model);

        await service.findAllPaginated({
          page: 1,
          pageSize: 20,
          sortField,
          sortDirection: SortDirection.ASC,
        } as PaginationQueryDto);

        expect(findChain.sort).toHaveBeenCalledWith(dbSort);
      },
    );

    it.each(cases)(
      'sorts by $sortField descending',
      async ({ sortField, dbSort }) => {
        const { model, findChain } = makeModel([], 0);
        const service = new UsersService(model);

        const descSort = Object.fromEntries(
          Object.entries(dbSort).map(([field]) => [field, -1]),
        );

        await service.findAllPaginated({
          page: 1,
          pageSize: 20,
          sortField,
          sortDirection: SortDirection.DESC,
        } as PaginationQueryDto);

        expect(findChain.sort).toHaveBeenCalledWith(descSort);
      },
    );

    it('falls back to createdAt desc when sortField is unknown', async () => {
      const { model, findChain } = makeModel([], 0);
      const service = new UsersService(model);

      await service.findAllPaginated({
        page: 1,
        pageSize: 20,
        sortField: 'inexistente',
      } as PaginationQueryDto);

      expect(findChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
    });
  });

  it('runs the data query and the count in parallel against the same (empty) filter', async () => {
    const { model, find, countDocuments } = makeModel([], 0);
    const service = new UsersService(model);

    await service.findAllPaginated({
      page: 1,
      pageSize: 20,
    } as PaginationQueryDto);

    expect(find).toHaveBeenCalledWith();
    expect(countDocuments).toHaveBeenCalledWith();
  });

  it('never includes password in the mapped items, and computes the effective state', async () => {
    const inactiveDoc = fakeUserDoc({
      lastSignedIn: new Date('2000-01-01T00:00:00.000Z'),
      password: 'super-secret-hash',
    } as Partial<UserDocument>);
    const { model } = makeModel([inactiveDoc], 1);
    const service = new UsersService(model);

    const result = await service.findAllPaginated({
      page: 1,
      pageSize: 20,
    } as PaginationQueryDto);

    expect(result.data[0]).not.toHaveProperty('password');
    expect(result.data[0].state).toBe(UserState.INACTIVE);
  });
});
