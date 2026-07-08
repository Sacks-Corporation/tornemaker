import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

const SALT_ROUNDS = 10;

export interface GoogleUserPayload {
  googleId: string;
  email: string;
  firstName: string;
  lastName: string;
  picture?: string;
}

export interface CreateLocalUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
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
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  /**
   * Same as findByEmail but also brings back the (normally hidden) password
   * hash, needed to verify credentials during local login.
   */
  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .exec();
  }

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  /**
   * Registers a new local (email/password) user.
   * Throws ConflictException if the email is already registered.
   */
  async createLocalUser(
    payload: CreateLocalUserPayload,
  ): Promise<UserDocument> {
    const existing = await this.findByEmail(payload.email);
    if (existing) {
      throw new ConflictException('EMAIL_ALREADY_REGISTERED');
    }

    const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS);

    try {
      const created = new this.userModel({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        password: passwordHash,
        provider: 'local',
      });
      return await created.save();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('EMAIL_ALREADY_REGISTERED');
      }
      throw error;
    }
  }

  /**
   * Finds an existing user by googleId, or links Google to an existing
   * local account with the same email, or creates a brand new user.
   */
  async findOrCreateFromGoogle(
    payload: GoogleUserPayload,
  ): Promise<UserDocument> {
    const existingByGoogleId = await this.findByGoogleId(payload.googleId);
    if (existingByGoogleId) {
      return existingByGoogleId;
    }

    const existingByEmail = await this.findByEmail(payload.email);
    if (existingByEmail) {
      // Link Google to the existing account (local or previously google-only).
      existingByEmail.googleId = payload.googleId;
      if (payload.picture) {
        existingByEmail.picture = payload.picture;
      }
      return existingByEmail.save();
    }

    try {
      const created = new this.userModel({
        googleId: payload.googleId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        picture: payload.picture,
        provider: 'google',
      });
      return await created.save();
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('EMAIL_ALREADY_REGISTERED');
      }
      throw error;
    }
  }

  /** Detects MongoDB's duplicate key error (E11000). */
  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: number }).code === 11000
    );
  }
}
