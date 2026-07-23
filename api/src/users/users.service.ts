import { ConflictException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { Model } from 'mongoose';
import {
  buildPaginatedResult,
  getPaginationSkip,
  PaginatedResult,
  PaginationQueryDto,
} from '../common/pagination';
import { User, UserDocument } from './schemas/user.schema';
import { toUserListItem, UserListItem } from './user-list-item';

const SALT_ROUNDS = 10;

/** Fields projected for `GET /users` — see `findAllPaginated`. Deliberately
 *  excludes `password` and `googleId`; never widen this without checking
 *  `UserListItem`/`toUserListItem` stay in sync. */
const LIST_PROJECTION =
  'firstName lastName email updatedAt lastSignedIn state provider';

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
    const now = new Date();

    try {
      const created = new this.userModel({
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
        password: passwordHash,
        provider: 'local',
        lastSignedIn: now,
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
   * Finds a user matching this Google identity WITHOUT ever creating one:
   * first by `googleId`, then by `email` (in which case Google gets linked
   * to that existing — local or previously google-only — account). Returns
   * `null` when neither matches, i.e. this Google identity has no account
   * in our database yet.
   *
   * Used by the LOGIN flow (`AuthService.loginWithGoogle`), which must
   * reject unknown users instead of silently creating them — see
   * `findOrCreateFromGoogle` below for the REGISTER counterpart.
   */
  async findByGoogleIdentity(
    payload: GoogleUserPayload,
  ): Promise<UserDocument | null> {
    const existingByGoogleId = await this.findByGoogleId(payload.googleId);
    if (existingByGoogleId) {
      return existingByGoogleId;
    }

    const existingByEmail = await this.findByEmail(payload.email);
    if (!existingByEmail) {
      return null;
    }

    // Link Google to the existing account (local or previously google-only).
    existingByEmail.googleId = payload.googleId;
    if (payload.picture) {
      existingByEmail.picture = payload.picture;
    }
    return existingByEmail.save();
  }

  /**
   * REGISTER counterpart of `findByGoogleIdentity`: same lookup/linking
   * behavior, but creates a brand new user when no match exists instead of
   * returning `null`. Used by `AuthService.registerWithGoogle` only — the
   * login flow must never create a user implicitly.
   */
  async findOrCreateFromGoogle(
    payload: GoogleUserPayload,
  ): Promise<UserDocument> {
    const existing = await this.findByGoogleIdentity(payload);
    if (existing) {
      return existing;
    }

    try {
      const created = new this.userModel({
        googleId: payload.googleId,
        email: payload.email,
        firstName: payload.firstName,
        lastName: payload.lastName,
        picture: payload.picture,
        provider: 'google',
        lastSignedIn: new Date(),
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
   * Records a successful sign-in by setting `lastSignedIn` to now. Called
   * after every successful local login, Google login, and Google register
   * that signs an already-existing user in (see `AuthService`) — never for
   * backoffice admin logins, which don't go through this collection.
   *
   * Uses `{ timestamps: false }` so this update does NOT bump `updatedAt`:
   * for now `updatedAt` must stay equal to `createdAt` (there is no profile
   * editing yet), and a plain `updateOne` would otherwise touch it on every
   * single login since the schema has `{ timestamps: true }`.
   */
  async touchLastSignedIn(userId: string): Promise<void> {
    await this.userModel.updateOne(
      { _id: userId },
      { $set: { lastSignedIn: new Date() } },
      { timestamps: false },
    );
  }

  /**
   * GET /users (backoffice listing) — paginated, most recently created
   * first. Only projects the fields `UserListItem` needs (see
   * `LIST_PROJECTION`); `password`/`googleId` never leave this method. Each
   * item's `state` is the EFFECTIVE state, computed fresh on every call by
   * `toUserListItem` — never trusted straight from the stored document. See
   * `.claude/skills/paginated-endpoint/SKILL.md` for the shared pagination
   * contract (`buildPaginatedResult`/`getPaginationSkip`).
   */
  async findAllPaginated(
    query: PaginationQueryDto,
  ): Promise<PaginatedResult<UserListItem>> {
    const { page, pageSize } = query;

    const [docs, total] = await Promise.all([
      this.userModel
        .find()
        .select(LIST_PROJECTION)
        .sort({ createdAt: -1 })
        .skip(getPaginationSkip(page, pageSize))
        .limit(pageSize)
        .exec(),
      this.userModel.countDocuments().exec(),
    ]);

    const data = docs.map(toUserListItem);
    return buildPaginatedResult(data, total, page, pageSize);
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
