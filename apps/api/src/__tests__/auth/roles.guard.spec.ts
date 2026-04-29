import { RolesGuard } from '../../auth/roles.guard';
import { Reflector } from '@nestjs/core';
import { ForbiddenException } from '@nestjs/common';
import { Role } from '@prisma/client';

const mockContext = (roles: Role[], user: any) => ({
  getHandler: () => ({}),
  getClass: () => ({}),
  switchToHttp: () => ({
    getRequest: () => ({ user }),
  }),
});

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  it('SUPER_ADMIN passe toujours', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MANAGER]);
    const user = { role: Role.SUPER_ADMIN };
    const result = guard.canActivate(mockContext([Role.MANAGER], user) as any);
    expect(result).toBe(true);
  });

  it('EMPLOYEE bloqué sur route MANAGER', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MANAGER]);
    const user = { role: Role.EMPLOYEE };
    expect(() => guard.canActivate(mockContext([Role.MANAGER], user) as any))
      .toThrow(ForbiddenException);
  });

  it('MANAGER passe sur route MANAGER', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([Role.MANAGER]);
    const user = { role: Role.MANAGER };
    const result = guard.canActivate(mockContext([Role.MANAGER], user) as any);
    expect(result).toBe(true);
  });

  it('pas de rôles requis → accès libre', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue([]);
    const user = { role: Role.EMPLOYEE };
    const result = guard.canActivate(mockContext([], user) as any);
    expect(result).toBe(true);
  });
});