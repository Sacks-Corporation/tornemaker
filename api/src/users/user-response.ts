import { UserDocument } from './schemas/user.schema';

/**
 * Public shape of a User returned by the API. Never includes the password
 * hash or internal Mongo fields.
 */
export interface UserResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  provider: 'local' | 'google';
  picture: string | null;
}

/**
 * Maps a UserDocument (Mongoose) to the public UserResponse shape.
 * Single source of truth used by every auth endpoint (register, login,
 * google, me) so the response shape stays consistent.
 */
export function toUserResponse(user: UserDocument): UserResponse {
  return {
    id: (user._id as { toString(): string }).toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    provider: user.provider,
    picture: user.picture ?? null,
  };
}
