import { Module } from '@nestjs/common';
import { TimeEntriesController } from './time-entries.controller';
import { TimeEntriesService } from './time-entries.service';
import { AuditService } from '../audit/audit.service';
import { AlertsService } from '../alerts/alerts.service';

@Module({
  controllers: [TimeEntriesController],
  providers: [TimeEntriesService, AuditService, AlertsService],
  exports: [TimeEntriesService],
})
export class TimeEntriesModule {}
