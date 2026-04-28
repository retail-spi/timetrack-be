import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AlertsService } from '../alerts/alerts.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { AuditAction, EmployeeScope, Role, User } from '@prisma/client';

@Injectable()
export class TimeEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly alerts: AlertsService,
  ) {}

  private assertEmployeeScope(user: User) {
    if (user.scope === EmployeeScope.worker) {
      throw new ForbiddenException('Les workers utilisent WorkerTimeEntry');
    }
  }

  private async assertOwnerOrManager(entryUserId: string, requestingUser: User) {
    if (requestingUser.role === Role.SUPER_ADMIN) return;
    if (requestingUser.id === entryUserId) return;

    if (requestingUser.role === Role.MANAGER) {
      const employee = await this.prisma.user.findFirst({
        where: { id: entryUserId, managerId: requestingUser.id },
      });
      if (employee) return;
    }

    if (requestingUser.role === Role.HR) {
      const employee = await this.prisma.user.findFirst({
        where: { id: entryUserId, hrScopeId: requestingUser.hrScopeId ?? undefined },
      });
      if (employee) return;
    }

    throw new ForbiddenException('Accès refusé');
  }

  async create(userId: string, dto: CreateTimeEntryDto, requestingUser: User) {
    this.assertEmployeeScope(requestingUser);

    if (requestingUser.id !== userId && requestingUser.role === Role.EMPLOYEE) {
      throw new ForbiddenException('Un employé ne peut créer que ses propres entrées');
    }

    const start = new Date(dto.startTime);
    const end = new Date(dto.endTime);
    if (end <= start) throw new BadRequestException('endTime doit être après startTime');

    const entry = await this.prisma.timeEntry.create({
      data: {
        userId,
        date: new Date(dto.date),
        startTime: start,
        endTime: end,
        breakMinutes: dto.breakMinutes,
        activityTypeId: dto.activityTypeId,
        projectId: dto.projectId,
        note: dto.note,
      },
    });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.CREATE,
      entity: 'TimeEntry',
      entityId: entry.id,
      after: entry,
    });

    await this.alerts.checkWeeklyHours(userId, new Date(dto.date));

    return entry;
  }

  async findAll(requestingUser: User, filters?: { userId?: string; week?: string }) {
    const where: any = {};

    if (requestingUser.role === Role.EMPLOYEE) {
      where.userId = requestingUser.id;
    } else if (requestingUser.role === Role.MANAGER) {
      const team = await this.prisma.user.findMany({
        where: { managerId: requestingUser.id },
        select: { id: true },
      });
      where.userId = { in: team.map((u) => u.id) };
    } else if (requestingUser.role === Role.HR) {
      const scope = await this.prisma.user.findMany({
        where: { hrScopeId: requestingUser.hrScopeId ?? undefined },
        select: { id: true },
      });
      where.userId = { in: scope.map((u) => u.id) };
    }
    // SUPER_ADMIN : pas de filtre

    if (filters?.userId && requestingUser.role === Role.SUPER_ADMIN) {
      where.userId = filters.userId;
    }

    return this.prisma.timeEntry.findMany({
      where,
      include: { user: { select: { firstName: true, lastName: true } }, activityType: true, project: true },
      orderBy: { date: 'desc' },
    });
  }

  async findOne(id: string, requestingUser: User) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException('TimeEntry introuvable');
    await this.assertOwnerOrManager(entry.userId, requestingUser);
    return entry;
  }

  async update(id: string, dto: UpdateTimeEntryDto, requestingUser: User) {
    const entry = await this.findOne(id, requestingUser);
    const before = { ...entry };

    const updated = await this.prisma.timeEntry.update({
      where: { id },
      data: {
        ...(dto.date && { date: new Date(dto.date) }),
        ...(dto.startTime && { startTime: new Date(dto.startTime) }),
        ...(dto.endTime && { endTime: new Date(dto.endTime) }),
        ...(dto.breakMinutes !== undefined && { breakMinutes: dto.breakMinutes }),
        ...(dto.activityTypeId && { activityTypeId: dto.activityTypeId }),
        ...(dto.projectId !== undefined && { projectId: dto.projectId }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
    });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.UPDATE,
      entity: 'TimeEntry',
      entityId: id,
      before,
      after: updated,
    });

    return updated;
  }

  async remove(id: string, requestingUser: User) {
    const entry = await this.findOne(id, requestingUser);

    await this.prisma.timeEntry.delete({ where: { id } });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.DELETE,
      entity: 'TimeEntry',
      entityId: id,
      before: entry,
    });
  }

  async approve(id: string, requestingUser: User) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException();

    // Interdiction d'auto-approbation
    if (entry.userId === requestingUser.id) {
      throw new ForbiddenException("Vous ne pouvez pas approuver votre propre entrée");
    }

    if (!(requestingUser.role === Role.MANAGER || requestingUser.role === Role.HR || requestingUser.role === Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Rôle insuffisant');
    }

    const updated = await this.prisma.timeEntry.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.APPROVE,
      entity: 'TimeEntry',
      entityId: id,
    });

    return updated;
  }

  async reject(id: string, requestingUser: User) {
    const entry = await this.prisma.timeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException();

    if (entry.userId === requestingUser.id) {
      throw new ForbiddenException("Vous ne pouvez pas rejeter votre propre entrée");
    }

    const updated = await this.prisma.timeEntry.update({
      where: { id },
      data: { status: 'REJECTED' },
    });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.REJECT,
      entity: 'TimeEntry',
      entityId: id,
    });

    return updated;
  }
}
