import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { WorkerTimeEntriesService, CreateWorkerTimeEntryDto } from './worker-time-entries.service';
import type { User } from '@prisma/client';
import { Role } from '@prisma/client';

@Controller('worker-time-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkerTimeEntriesController {
  constructor(private readonly service: WorkerTimeEntriesService) {}

  @Post()
  create(@Body() dto: CreateWorkerTimeEntryDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user);
  }

  @Patch(':id/approve')
  @Roles(Role.MANAGER, Role.HR, Role.SUPER_ADMIN)
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.approve(id, user);
  }
}
