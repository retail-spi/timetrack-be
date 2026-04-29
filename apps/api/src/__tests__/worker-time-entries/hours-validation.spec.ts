import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { WorkerTimeEntriesService } from '../../worker-time-entries/worker-time-entries.service';
import { EmployeeScope, Role, User } from '@prisma/client';

describe('WorkerTimeEntriesService.create', () => {
  let service: WorkerTimeEntriesService;
  let prisma: any;
  let audit: any;
  let alerts: any;

  beforeEach(() => {
    prisma = {
      workerTimeEntry: { create: jest.fn() },
      user: { findUnique: jest.fn() },
    };
    audit = { log: jest.fn() };
    alerts = { checkWeeklyHours: jest.fn() };
    service = new WorkerTimeEntriesService(prisma, audit, alerts);
  });

  it.each([7.3, 7.7, 0.3, 8.1])('doit rejeter hours=%s (non-.5)', async (hours) => {
    const user = { id: 'w1', scope: EmployeeScope.worker, role: Role.EMPLOYEE } as User;
    await expect(service.create({ date: '2024-01-15', hours, taskTypeId: 't1' }, user))
      .rejects.toThrow(BadRequestException);
  });

  it.each([7.0, 7.5, 8.0, 0.5])('doit accepter hours=%s', async (hours) => {
    const user = { id: 'w1', scope: EmployeeScope.worker, role: Role.EMPLOYEE } as User;
    prisma.workerTimeEntry.create.mockResolvedValue({ id: 'wte1', hours });
    await expect(service.create({ date: '2024-01-15', hours, taskTypeId: 't1' }, user))
      .resolves.toBeDefined();
  });

  it('doit rejeter un non-worker', async () => {
    const user = { id: 'u1', scope: EmployeeScope.employee_office, role: Role.EMPLOYEE } as User;
    await expect(service.create({ date: '2024-01-15', hours: 7.5, taskTypeId: 't1' }, user))
      .rejects.toThrow(ForbiddenException);
  });
});