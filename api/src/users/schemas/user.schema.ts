import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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

  // createdAt and updatedAt are injected automatically by { timestamps: true }
}

export const UserSchema = SchemaFactory.createForClass(User);
