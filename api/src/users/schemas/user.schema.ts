import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { UserState } from './user-state.enum';

export type UserDocument = HydratedDocument<User>;

/**
 * A user can be created either through:
 * - Local registration (firstName/lastName/email/password), or
 * - Google Sign-In (OAuth ID token).
 *
 * A local account can later be linked to Google (googleId/picture get set),
 * in which case `provider` stays 'local' but `googleId` is present too.
 * A Google-only account never has a `password`.
 */
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, trim: true })
  firstName: string;

  @Prop({ required: true, trim: true })
  lastName: string;

  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  /**
   * Hashed with bcrypt (salt rounds 10). Optional because Google-only
   * accounts don't have a local password. Excluded from queries by default;
   * fetch explicitly with `.select('+password')` when needed (e.g. login).
   */
  @Prop({ select: false })
  password?: string;

  /**
   * Google's `sub` claim. Optional — only present for accounts that signed
   * in (or linked) with Google. Sparse index so multiple documents can omit
   * it without violating uniqueness.
   */
  @Prop({ unique: true, sparse: true })
  googleId?: string;

  /** Origin provider of the account. */
  @Prop({ required: true, enum: ['local', 'google'] })
  provider: 'local' | 'google';

  @Prop()
  picture?: string;

  /**
   * Coarse-grained account state — see `user-state.enum.ts`. `ACTIVE` is the
   * default at creation time. `BLOCKED` is persisted explicitly by
   * `UsersService.disableUser` (and reset back to `ACTIVE` by `enableUser`)
   * as a backoffice moderation action — see `setEnabled`. `INACTIVE` is
   * never persisted; it's derived at read time from `lastSignedIn`
   * (`computeEffectiveUserState`).
   */
  @Prop({ type: String, enum: UserState, default: UserState.ACTIVE })
  state: UserState;

  /**
   * Whether this account is allowed to sign in. Defaults to `true` for every
   * account (local or Google) at creation time — `UsersService.createLocalUser`
   * / `findOrCreateFromGoogle` deliberately rely on this schema default
   * instead of setting it explicitly, same convention already used for
   * `state`. Toggled by a backoffice admin via `PATCH /users/:id/enable` /
   * `PATCH /users/:id/disable` (see `UsersService.enableUser` / `disableUser`).
   * Enforced at LOGIN time only — `AuthService.login` / `loginWithGoogle` /
   * `registerWithGoogle` reject with `UnauthorizedException('USER_DISABLED')`
   * when `false`. Never checked for the backoffice admin login
   * (`AuthService.loginBackoffice`), which is a completely separate
   * collection/flow (`admins`, not `users`).
   */
  @Prop({ type: Boolean, default: true })
  enabled: boolean;

  /**
   * Timestamp of the user's last successful sign-in (local login, Google
   * login, or Google register when it signs an already-existing user in).
   * Set to `createdAt` at creation time and updated on every successful
   * sign-in via `UsersService.touchLastSignedIn` — WITHOUT touching
   * `updatedAt` (see that method for why).
   */
  @Prop()
  lastSignedIn: Date;

  // createdAt and updatedAt are injected automatically by { timestamps: true }
}

export const UserSchema = SchemaFactory.createForClass(User);
