import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { AdminsService } from '../../admins/admins.service';
import { AdminDocument } from '../../admins/schemas/admin.schema';
import { UserDocument } from '../../users/schemas/user.schema';
import { UsersService } from '../../users/users.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { JwtStrategy } from './jwt.strategy';

function fakeConfigService(): ConfigService {
  return {
    getOrThrow: jest.fn().mockReturnValue('test-secret'),
  } as unknown as ConfigService;
}

function fakeUser(): UserDocument {
  return {
    _id: new Types.ObjectId(),
    firstName: 'Ada',
    lastName: 'Lovelace',
    email: 'ada@example.com',
    provider: 'local',
  } as unknown as UserDocument;
}

function fakeAdmin(): AdminDocument {
  return {
    _id: new Types.ObjectId(),
    email: 'admin@tornemaker.com',
  } as unknown as AdminDocument;
}

function makeStrategy(options: {
  user?: UserDocument | null;
  admin?: AdminDocument | null;
}) {
  const usersService = {
    findById: jest.fn().mockResolvedValue(options.user ?? null),
  } as unknown as UsersService;
  const adminsService = {
    findById: jest.fn().mockResolvedValue(options.admin ?? null),
  } as unknown as AdminsService;

  const strategy = new JwtStrategy(
    fakeConfigService(),
    usersService,
    adminsService,
  );
  return { strategy, usersService, adminsService };
}

describe('JwtStrategy.validate', () => {
  it('resolves a regular user token (no role claim) against UsersService and tags it role: "user"', async () => {
    const user = fakeUser();
    const { strategy, usersService, adminsService } = makeStrategy({ user });

    const payload: JwtPayload = { sub: 'irrelevant', email: user.email };
    const principal = await strategy.validate(payload);

    expect(usersService.findById).toHaveBeenCalledWith(payload.sub);
    expect(adminsService.findById).not.toHaveBeenCalled();
    expect(principal.role).toBe('user');
    expect(principal.email).toBe(user.email);
  });

  it('resolves a backoffice admin token (role: "admin") against AdminsService and tags it role: "admin"', async () => {
    const admin = fakeAdmin();
    const { strategy, usersService, adminsService } = makeStrategy({ admin });

    const payload: JwtPayload = {
      sub: 'irrelevant',
      email: admin.email,
      role: 'admin',
    };
    const principal = await strategy.validate(payload);

    expect(adminsService.findById).toHaveBeenCalledWith(payload.sub);
    expect(usersService.findById).not.toHaveBeenCalled();
    expect(principal.role).toBe('admin');
    expect(principal.email).toBe(admin.email);
  });

  it('rejects with UnauthorizedException when the user sub does not resolve to any user', async () => {
    const { strategy } = makeStrategy({ user: null });

    await expect(
      strategy.validate({ sub: 'missing', email: 'nobody@example.com' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects with UnauthorizedException when the admin sub does not resolve to any admin', async () => {
    const { strategy } = makeStrategy({ admin: null });

    await expect(
      strategy.validate({
        sub: 'missing',
        email: 'nobody@example.com',
        role: 'admin',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
