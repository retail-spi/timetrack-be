import { Module } from '@nestjs/common';
import { ActivityTypesController } from './activity-types.controller';

@Module({
  controllers: [ActivityTypesController],
})
export class ActivityTypesModule {}