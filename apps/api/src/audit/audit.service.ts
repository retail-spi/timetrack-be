import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction } from '@prisma/client';

export interface AuditParams {
  userId: string;
  action: AuditAction;
  entity: string;
  entityId: string;
  before?: object;
  after?: object;
  ip?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: AuditParams): Promise<void> {
    await this.prisma.auditLog.create({
      data: {
        userId: params.userId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        before: params.before ?? undefined,
        after: params.after ?? undefined,
        ip: params.ip,
      },
    });
  }
}
