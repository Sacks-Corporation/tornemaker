import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Admin, AdminDocument } from './schemas/admin.schema';

@Injectable()
export class AdminsService {
  constructor(
    @InjectModel(Admin.name) private readonly adminModel: Model<AdminDocument>,
  ) {}

  /**
   * Finds an admin by email, including the (normally hidden) password hash —
   * the only current consumer is the backoffice login flow, which needs it
   * to run `bcrypt.compare`.
   */
  async findByEmail(email: string): Promise<AdminDocument | null> {
    return this.adminModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .exec();
  }

  /**
   * Finds an admin by id (never includes the password hash, same default
   * projection as `Admin.password`'s `select: false`). Used by `JwtStrategy`
   * to resolve the `sub` of a backoffice admin token (`role: 'admin'`).
   */
  async findById(id: string): Promise<AdminDocument | null> {
    return this.adminModel.findById(id).exec();
  }
}
