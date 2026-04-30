import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import type { User } from '@prisma/client';

@Controller('alerts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AlertsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.prisma.alert.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Patch(':id/read')
  markRead(@Param('id') id: string) {
    return this.prisma.alert.update({
      where: { id },
      data: { isRead: true },
    });
  }
}