import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import type { User } from '@prisma/client';
import { AuditAction, Role } from '@prisma/client';

@Controller('exports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExportsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  @Get('time-entries/csv')
  @Roles(Role.MANAGER, Role.HR, Role.SUPER_ADMIN)
  async exportTimeEntries(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('userId') userId: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const where: any = {
      date: {
        gte: new Date(from),
        lte: new Date(to),
      },
    };
    if (userId) where.userId = userId;

    const entries = await this.prisma.timeEntry.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        activityType: true,
        project: true,
      },
    });

    const header = 'Date,Prénom,Nom,Email,Début,Fin,Pause(min),Activité,Projet,Statut\n';
    const rows = entries.map((e) =>
      [
        e.date.toISOString().split('T')[0],
        e.user.firstName,
        e.user.lastName,
        e.user.email,
        e.startTime.toISOString(),
        e.endTime.toISOString(),
        e.breakMinutes,
        e.activityType.code,
        e.project?.name ?? '',
        e.status,
      ].join(','),
    );

    const csv = header + rows.join('\n');

    await this.audit.log({
      userId: user.id,
      action: AuditAction.EXPORT,
      entity: 'TimeEntry',
      entityId: 'bulk',
      after: { from, to, count: entries.length },
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="time-entries-${from}-${to}.csv"`);
    res.send(csv);
  }

  @Get('worker-entries/csv')
  @Roles(Role.MANAGER, Role.HR, Role.SUPER_ADMIN)
  async exportWorkerEntries(
    @Query('from') from: string,
    @Query('to') to: string,
    @CurrentUser() user: User,
    @Res() res: Response,
  ) {
    const entries = await this.prisma.workerTimeEntry.findMany({
      where: { date: { gte: new Date(from), lte: new Date(to) } },
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
        taskType: true,
        project: true,
      },
    });

    const header = 'Date,Prénom,Nom,Email,Heures,Tâche,Projet,Statut\n';
    const rows = entries.map((e) =>
      [
        e.date.toISOString().split('T')[0],
        e.user.firstName,
        e.user.lastName,
        e.user.email,
        e.hours,
        e.taskType.code,
        e.project?.name ?? '',
        e.status,
      ].join(','),
    );

    await this.audit.log({
      userId: user.id,
      action: AuditAction.EXPORT,
      entity: 'WorkerTimeEntry',
      entityId: 'bulk',
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="worker-entries-${from}-${to}.csv"`);
    res.send(header + rows.join('\n'));
  }
}
