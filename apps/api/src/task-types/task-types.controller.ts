import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Controller('task-types')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TaskTypesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  findAll() {
    return this.prisma.taskType.findMany({ where: { isActive: true } });
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: { code: string; label: string }) {
    return this.prisma.taskType.create({ data: dto });
  }
}