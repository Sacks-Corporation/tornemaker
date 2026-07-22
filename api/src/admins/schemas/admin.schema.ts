import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AdminDocument = HydratedDocument<Admin>;

/**
 * Backoffice administrator account, stored in its own `admins` collection
 * (separate from regular `users`). Authenticated purely with email/password
 * (bcrypt hash) + our own JWT — no Google Sign-In, no refresh tokens.
 */
@Schema({ timestamps: true, collection: 'admins' })
export class Admin {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  /**
   * Hashed with bcrypt (salt rounds 10). Excluded from queries by default;
   * fetch explicitly with `.select('+password')` when needed (e.g. login).
   * The plain-text password must never reach this field/schema/service —
   * only the seed script (see `src/migrations/`) ever handles it, and only
   * to hash it before persisting.
   */
  @Prop({ required: true, select: false })
  password: string;

  // createdAt and updatedAt are injected automatically by { timestamps: true }
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
