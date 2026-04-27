import { Module } from '@nestjs/common';
import { CorrectionsController } from './corrections.controller';
import { CorrectionsService } from './corrections.service';
import { AuditService } from '../audit/audit.service';

@Module({
  controllers: [CorrectionsController],
  providers: [CorrectionsService, AuditService],
})
export class CorrectionsModule {}
