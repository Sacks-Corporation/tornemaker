import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

export interface GoogleUserPayload {
  googleId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findByGoogleId(googleId: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ googleId }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Finds an existing user by googleId or creates a new one.
   * This is the registration/login flow entry point.
   */
  async findOrCreate(payload: GoogleUserPayload): Promise<UserDocument> {
    const existing = await this.findByGoogleId(payload.googleId);
    if (existing) {
      return existing;
    }

    const created = new this.userModel({
      googleId: payload.googleId,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    });
    return created.save();
  }
}
