import { Types } from 'mongoose';
import { UserDocument } from './schemas/user.schema';
import { UserState } from './schemas/user-state.enum';
import { toUserListItem } from './user-list-item';

/** Builds a minimal fake `UserDocument` — only what `toUserListItem` reads. */
function fakeUser(overrides: Partial<UserDocument> = {}): UserDocument {
  return {
    _id: new Types.ObjectId(),
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    provider: 'local',
    state: UserState.ACTIVE,
    lastSignedIn: new Date('2026-07-20T00:00:00.000Z'),
    updatedAt: new Date('2026-07-21T00:00:00.000Z'),
    // Even if a caller forgets to exclude it in the query projection, the
    // mapper itself must never read/forward it.
    password: 'super-secret-hash',
    ...overrides,
  } as unknown as UserDocument;
}

describe('toUserListItem', () => {
  it('maps every public field, stringifying the id', () => {
    const user = fakeUser();
    const item = toUserListItem(user);

    expect(item.id).toBe((user._id as Types.ObjectId).toString());
    expect(item.firstName).toBe('Ada');
    expect(item.lastName).toBe('Lovelace');
    expect(item.email).toBe('ada@example.com');
    expect(item.provider).toBe('local');
    expect(item.lastSignedIn).toEqual(new Date('2026-07-20T00:00:00.000Z'));
    expect(item.updatedAt).toEqual(new Date('2026-07-21T00:00:00.000Z'));
  });

  it('never includes password (or any field beyond UserListItem) even if present on the document', () => {
    const item = toUserListItem(fakeUser());
    expect(item).not.toHaveProperty('password');
    expect(Object.keys(item).sort()).toEqual(
      [
        'email',
        'firstName',
        'id',
        'lastName',
        'lastSignedIn',
        'provider',
        'state',
        'updatedAt',
      ].sort(),
    );
  });

  it('computes the EFFECTIVE state instead of trusting the persisted one blindly', () => {
    const inactiveByInactivity = fakeUser({
      state: UserState.ACTIVE,
      lastSignedIn: new Date('2000-01-01T00:00:00.000Z'),
    });
    expect(toUserListItem(inactiveByInactivity).state).toBe(
      UserState.INACTIVE,
    );

    const blocked = fakeUser({
      state: UserState.BLOCKED,
      lastSignedIn: new Date(), // recent, but BLOCKED still wins
    });
    expect(toUserListItem(blocked).state).toBe(UserState.BLOCKED);
  });
});
