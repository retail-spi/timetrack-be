import { Module } from '@nestjs/common';
import { WorkerTimeEntriesController } from './worker-time-entries.controller';
import { WorkerTimeEntriesService } from './worker-time-entries.service';
import { AuditService } from '../audit/audit.service';
import { AlertsService } from '../alerts/alerts.service';

@Module({
  controllers: [WorkerTimeEntriesController],
  providers: [WorkerTimeEntriesService, AuditService, AlertsService],
  exports: [WorkerTimeEntriesService],
})
export class WorkerTimeEntriesModule {}
