import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ContractsService } from './contracts.service';
import { Role } from '@prisma/client';

@Controller('contracts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ContractsController {
  constructor(private readonly service: ContractsService) {}

  @Get()
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN)
  create(@Body() dto: any) {
    return this.service.create(dto);
  }

  @Put(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  update(@Param('id') id: string, @Body() dto: any) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.MANAGER, Role.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
