import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

/**
 * Users are created exclusively through Google Sign-In (OAuth).
 * The googleId field holds the unique identifier provided by Google (payload.sub).
 */
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  googleId: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop()
  picture?: string;

  // createdAt and updatedAt are injected automatically by { timestamps: true }
}

export const UserSchema = SchemaFactory.createForClass(User);
