import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { TimeEntriesModule } from './time-entries/time-entries.module';
import { WorkerTimeEntriesModule } from './worker-time-entries/worker-time-entries.module';
import { CorrectionsModule } from './corrections/corrections.module';
import { UsersModule } from './users/users.module';
import { ContractsModule } from './contracts/contracts.module';
import { ProjectsModule } from './projects/projects.module';
import { AuditModule } from './audit/audit.module';
import { ActivityTypesModule } from './activity-types/activity-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    ContractsModule,
    ProjectsModule,
    TimeEntriesModule,
    WorkerTimeEntriesModule,
    CorrectionsModule,
    AuditModule,
    ActivityTypesModule,
  ],
})
export class AppModule {}
