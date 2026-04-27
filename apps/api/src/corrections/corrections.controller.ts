import { Controller, Get, Post, Body, Param, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { CorrectionsService, CreateCorrectionDto } from './corrections.service';
import { Role, User } from '@prisma/client';

@Controller('corrections')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CorrectionsController {
  constructor(private readonly service: CorrectionsService) {}

  @Post()
  create(@Body() dto: CreateCorrectionDto, @CurrentUser() user: User) {
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

  @Patch(':id/reject')
  @Roles(Role.MANAGER, Role.HR, Role.SUPER_ADMIN)
  reject(@Param('id') id: string, @CurrentUser() user: User) {
    return this.service.reject(id, user);
  }
}
