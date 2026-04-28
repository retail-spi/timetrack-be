import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AlertsService } from '../alerts/alerts.service';
import { AuditAction, EmployeeScope, Role, User } from '@prisma/client';

export class CreateWorkerTimeEntryDto {
  date: string;
  hours: number;          // doit être .0 ou .5
  taskTypeId: string;
  projectId?: string;
  note?: string;
}

@Injectable()
export class WorkerTimeEntriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly alerts: AlertsService,
  ) {}

  private assertWorkerScope(user: User) {
    if (user.scope !== EmployeeScope.worker) {
      throw new ForbiddenException('Seuls les workers utilisent WorkerTimeEntry');
    }
  }

  private validateHours(hours: number) {
    // Incrément 0.5 uniquement
    if (hours <= 0 || hours > 24) throw new BadRequestException('Heures invalides');
    const decimal = hours % 1;
    if (decimal !== 0 && decimal !== 0.5) {
      throw new BadRequestException('Les heures doivent être en incrément de 0.5 (ex: 1.0, 1.5, 7.5)');
    }
  }

  async create(dto: CreateWorkerTimeEntryDto, requestingUser: User) {
    this.assertWorkerScope(requestingUser);
    this.validateHours(dto.hours);

    const entry = await this.prisma.workerTimeEntry.create({
      data: {
        userId: requestingUser.id,
        date: new Date(dto.date),
        hours: dto.hours,
        taskTypeId: dto.taskTypeId,
        projectId: dto.projectId,
        note: dto.note,
      },
    });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.CREATE,
      entity: 'WorkerTimeEntry',
      entityId: entry.id,
      after: entry,
    });

    await this.alerts.checkWeeklyHours(requestingUser.id, new Date(dto.date));

    return entry;
  }

  async findAll(requestingUser: User) {
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

    return this.prisma.workerTimeEntry.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true } },
        taskType: true,
        project: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  async approve(id: string, requestingUser: User) {
    const entry = await this.prisma.workerTimeEntry.findUnique({ where: { id } });
    if (!entry) throw new NotFoundException();

    // Interdiction d'auto-approbation
    if (entry.userId === requestingUser.id) {
      throw new ForbiddenException("Vous ne pouvez pas approuver votre propre entrée");
    }

    if (!(requestingUser.role === Role.MANAGER || requestingUser.role === Role.HR || requestingUser.role === Role.SUPER_ADMIN)) {
      throw new ForbiddenException('Rôle insuffisant');
    }

    const updated = await this.prisma.workerTimeEntry.update({
      where: { id },
      data: { status: 'APPROVED' },
    });

    await this.audit.log({
      userId: requestingUser.id,
      action: AuditAction.APPROVE,
      entity: 'WorkerTimeEntry',
      entityId: id,
    });

    return updated;
  }
}
