import { Controller, Get, Delete, Query, UseGuards, HttpCode } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Controller('audit-logs')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MANAGER, Role.SUPER_ADMIN)
export class AuditController {
  constructor(private readonly prisma: PrismaService) {}

  @Delete('reset')
  @Roles(Role.SUPER_ADMIN, Role.MANAGER)
  @HttpCode(200)
  async resetAll() {
    await this.prisma.auditLog.deleteMany({});
    return { message: 'Audit logs supprimés.' };
  }

  @Get()
  async findAll(@Query('entity') entity?: string, @Query('action') action?: string) {
    const where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }
}
