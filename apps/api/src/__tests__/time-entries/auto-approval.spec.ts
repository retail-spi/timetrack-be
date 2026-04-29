import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { TimeEntriesService } from '../../time-entries/time-entries.service';
import { Role, User } from '@prisma/client';

describe('TimeEntriesService.approve', () => {
  let service: TimeEntriesService;
  let prisma: any;
  let audit: any;
  let alerts: any;

  beforeEach(() => {
    prisma = {
      timeEntry: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      user: { findFirst: jest.fn(), findMany: jest.fn() },
    };
    audit = { log: jest.fn() };
    alerts = { checkWeeklyHours: jest.fn() };
    service = new TimeEntriesService(prisma, audit, alerts);
  });

  it('doit lever ForbiddenException si userId === requestingUser.id', async () => {
    const userId = 'user-1';
    prisma.timeEntry.findUnique.mockResolvedValue({ id: 'entry-1', userId, status: 'PENDING' });
    const requestingUser = { id: userId, role: Role.MANAGER } as User;
    await expect(service.approve('entry-1', requestingUser)).rejects.toThrow(ForbiddenException);
  });

  it('doit approuver si userId !== requestingUser.id', async () => {
    prisma.timeEntry.findUnique.mockResolvedValue({ id: 'entry-1', userId: 'other-user', status: 'PENDING' });
    prisma.timeEntry.update.mockResolvedValue({ id: 'entry-1', status: 'APPROVED' });
    const requestingUser = { id: 'manager-1', role: Role.MANAGER } as User;
    const result = await service.approve('entry-1', requestingUser);
    expect(result.status).toBe('APPROVED');
  });

  it('doit lever NotFoundException si entry introuvable', async () => {
    prisma.timeEntry.findUnique.mockResolvedValue(null);
    const requestingUser = { id: 'manager-1', role: Role.MANAGER } as User;
    await expect(service.approve('unknown', requestingUser)).rejects.toThrow(NotFoundException);
  });
});