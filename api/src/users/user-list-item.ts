import { UserDocument } from './schemas/user.schema';
import { UserState } from './schemas/user-state.enum';
import { computeEffectiveUserState } from './user-state.util';

/**
 * Row shape returned by `GET /users` (paginated admin listing) — deliberately
 * its OWN type, not `UserResponse` (auth's "current logged-in user" shape,
 * see `user-response.ts`): different consumer, different fields (no
 * `picture`; `state` here is the EFFECTIVE state, see
 * `computeEffectiveUserState`, not necessarily the persisted one). Never
 * includes `password` or any other internal/sensitive field.
 */
export interface UserListItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  updatedAt: Date;
  lastSignedIn: Date;
  state: UserState;
  provider: 'local' | 'google';
}

/**
 * Maps a `UserDocument` (as returned by `UsersService.findAllPaginated`,
 * which only ever selects the fields below — see the projection there) to
 * the public `UserListItem` shape, computing the EFFECTIVE `state` fresh on
 * every call instead of trusting the persisted one blindly.
 */
export function toUserListItem(user: UserDocument): UserListItem {
  const { updatedAt } = user as unknown as { updatedAt: Date };

  return {
    id: (user._id as { toString(): string }).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    updatedAt,
    lastSignedIn: user.lastSignedIn,
    state: computeEffectiveUserState(user.state, user.lastSignedIn),
    provider: user.provider,
  };
}
