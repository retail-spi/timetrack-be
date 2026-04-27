import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AuditAction, CorrectionStatus, Role, User } from '@prisma/client';

export class CreateCorrectionDto {
  timeEntryId?: string;
  workerTimeEntryId?: string;
  reason: string;
  proposedData: Record<string, unknown>;
}

@Injectable()
export class CorrectionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async create(dto: CreateCorrectionDto, requestingUser: User) {
    // RÈGLE : exactement l'un des deux doit être fourni
    const hasTimeEntry = !!dto.timeEntryId;
    const hasWorkerEntry = !!dto.workerTimeEntryId;

    if (hasTimeEntry === hasWorkerEntry) {
      throw new BadRequestException(
        'Une correction doit cibler soit timeEntryId, soit workerTimeEntryId — jamais les deux, jamais aucun',
      );
    }

    // Vérifier que la cible existe et appartient à l'utilisateur
    if (hasTimeEntry) {
      const entry = await this.prisma.timeEntry.findUnique({ where: { id: dto.timeEntryId } });
      if (!entry) throw new NotFoundException('TimeEntry introuvable');
      if (entry.userId !== requestingUser.id && requestingUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Accès refusé');
      }
    }

    if (hasWorkerEntry) {
      const entry = await this.prisma.workerTimeEntry.findUnique({ where: { id: dto.workerTimeEntryId } });
      if (!entry) throw new NotFoundException('WorkerTimeEntry introuvable');
      if (entry.userId !== requestingUser.id && requestingUser.role !== Role.SUPER_ADMIN) {
        throw new ForbiddenException('Accès refusé');
      }
    }

    const correction = await this.prisma.correction.create({
      data: {
        submittedById: requestingUser.id,
        timeEntryId: dto.timeEntryId,
        workerTimeEntryId: dto.workerTimeEntryId,
        reason: dto.reason,
        proposedData: dto.proposedData,
      },
    });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.CREATE,
      entity: 'Correction',
      entityId: correction.id,
      after: correction,
    });

    return correction;
  }

  async findAll(requestingUser: User) {
    const where: any = {};

    if (requestingUser.role === Role.EMPLOYEE) {
      where.submittedById = requestingUser.id;
    } else if (requestingUser.role === Role.MANAGER) {
      const team = await this.prisma.user.findMany({
        where: { managerId: requestingUser.id },
        select: { id: true },
      });
      where.submittedById = { in: team.map((u) => u.id) };
    }

    return this.prisma.correction.findMany({
      where,
      include: {
        submittedBy: { select: { firstName: true, lastName: true } },
        approvedBy: { select: { firstName: true, lastName: true } },
        timeEntry: true,
        workerTimeEntry: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approve(id: string, requestingUser: User) {
    const correction = await this.prisma.correction.findUnique({ where: { id } });
    if (!correction) throw new NotFoundException();

    // RÈGLE CRITIQUE : interdiction d'auto-approbation
    if (correction.submittedById === requestingUser.id) {
      throw new ForbiddenException("Vous ne pouvez pas approuver votre propre correction");
    }

    if (![Role.MANAGER, Role.HR, Role.SUPER_ADMIN].includes(requestingUser.role as Role)) {
      throw new ForbiddenException('Rôle insuffisant pour approuver');
    }

    if (correction.status !== CorrectionStatus.PENDING) {
      throw new BadRequestException('Cette correction a déjà été traitée');
    }

    const updated = await this.prisma.correction.update({
      where: { id },
      data: {
        status: CorrectionStatus.APPROVED,
        approvedById: requestingUser.id,
        approvedAt: new Date(),
      },
    });

    // Appliquer les données proposées
    if (correction.timeEntryId) {
      await this.prisma.timeEntry.update({
        where: { id: correction.timeEntryId },
        data: correction.proposedData as any,
      });
    } else if (correction.workerTimeEntryId) {
      await this.prisma.workerTimeEntry.update({
        where: { id: correction.workerTimeEntryId },
        data: correction.proposedData as any,
      });
    }

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.APPROVE,
      entity: 'Correction',
      entityId: id,
    });

    return updated;
  }

  async reject(id: string, requestingUser: User) {
    const correction = await this.prisma.correction.findUnique({ where: { id } });
    if (!correction) throw new NotFoundException();

    // RÈGLE CRITIQUE : interdiction d'auto-rejet aussi
    if (correction.submittedById === requestingUser.id) {
      throw new ForbiddenException("Vous ne pouvez pas rejeter votre propre correction");
    }

    if (correction.status !== CorrectionStatus.PENDING) {
      throw new BadRequestException('Cette correction a déjà été traitée');
    }

    const updated = await this.prisma.correction.update({
      where: { id },
      data: {
        status: CorrectionStatus.REJECTED,
        approvedById: requestingUser.id,
        approvedAt: new Date(),
      },
    });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.REJECT,
      entity: 'Correction',
      entityId: id,
    });

    return updated;
  }
}
