import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { CorrectionsService } from '../../corrections/corrections.service';
import { Role, User } from '@prisma/client';

describe('CorrectionsService.create', () => {
  let service: CorrectionsService;
  let prisma: any;
  let audit: any;

  beforeEach(() => {
    prisma = {
      correction: { create: jest.fn() },
      timeEntry: { findUnique: jest.fn() },
      workerTimeEntry: { findUnique: jest.fn() },
    };
    audit = { log: jest.fn() };
    service = new CorrectionsService(prisma, audit);
  });

  it('doit lever BadRequestException si les deux IDs sont fournis', async () => {
    const user = { id: 'u1', role: Role.EMPLOYEE } as User;
    await expect(service.create({
      timeEntryId: 'te1',
      workerTimeEntryId: 'wte1',
      reason: 'Erreur',
      proposedData: {},
    }, user)).rejects.toThrow(BadRequestException);
  });

  it('doit lever BadRequestException si aucun ID n\'est fourni', async () => {
    const user = { id: 'u1', role: Role.EMPLOYEE } as User;
    await expect(service.create({
      reason: 'Erreur',
      proposedData: {},
    }, user)).rejects.toThrow(BadRequestException);
  });

  it('doit créer si timeEntryId fourni', async () => {
    const user = { id: 'u1', role: Role.EMPLOYEE } as User;
    prisma.timeEntry.findUnique.mockResolvedValue({ id: 'te1', userId: 'u1' });
    prisma.correction.create.mockResolvedValue({ id: 'c1' });
    await expect(service.create({
      timeEntryId: 'te1',
      reason: 'Erreur',
      proposedData: {},
    }, user)).resolves.toBeDefined();
  });
});