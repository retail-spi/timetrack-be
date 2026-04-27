import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Patch } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { TimeEntriesService } from './time-entries.service';
import { CreateTimeEntryDto } from './dto/create-time-entry.dto';
import { UpdateTimeEntryDto } from './dto/update-time-entry.dto';
import { Role, User } from '@prisma/client';

@Controller('time-entries')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TimeEntriesController {
  constructor(private readonly service: TimeEntriesService) {}

  @Post()
  create(@Body() dto: CreateTimeEntryDto, @CurrentUser() user: User) {
    return this.service.create(user.id, dto, user);
  }

  @Get()
  findAll(@CurrentUser() user: User) {
    return this.service.findAll(user);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.findOne(id, user);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTimeEntryDto, @CurrentUser() user: User) {
    return this.service.update(id, dto, user);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.remove(id, user);
  }

  @Patch(':id/approve')
  @Roles(Role.MANAGER, Role.HR, Role.SUPER_ADMIN)
  approve(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.approve(id, user);
  }

  @Patch(':id/reject')
  @Roles(Role.MANAGER, Role.HR, Role.SUPER_ADMIN)
  reject(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.reject(id, user);
  }
}
