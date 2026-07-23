import { Model, Types } from 'mongoose';
import { PaginationQueryDto } from '../common/pagination';
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

    const query: PaginationQueryDto = { page: 2, pageSize: 7 };
    const result = await service.findAllPaginated(query);

    expect(result.total).toBe(42);
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(7);
    expect(result.data).toHaveLength(2);
  });

  it('applies skip/limit for the requested page/pageSize (page 2, pageSize 7 -> records 8-14 -> skip 7, limit 7)', async () => {
    const { model, findChain } = makeModel([], 0);
    const service = new UsersService(model);

    await service.findAllPaginated({ page: 2, pageSize: 7 });

    expect(findChain.skip).toHaveBeenCalledWith(7);
    expect(findChain.limit).toHaveBeenCalledWith(7);
  });

  it('runs the data query and the count in parallel against the same (empty) filter', async () => {
    const { model, find, countDocuments } = makeModel([], 0);
    const service = new UsersService(model);

    await service.findAllPaginated({ page: 1, pageSize: 20 });

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

    const result = await service.findAllPaginated({ page: 1, pageSize: 20 });

    expect(result.data[0]).not.toHaveProperty('password');
    expect(result.data[0].state).toBe(UserState.INACTIVE);
  });
});
