import { Module } from '@nestjs/common';
import { TaskTypesController } from './task-types.controller';

@Module({
  controllers: [TaskTypesController],
})
export class TaskTypesModule {}