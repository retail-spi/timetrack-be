import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ContractsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.contract.findMany({
      include: { user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({ where: { id } });
    if (!contract) throw new NotFoundException('Contrat introuvable');
    return contract;
  }

  async create(data: {
    userId: string; contractType: any; weeklyHours: number; startDate: string; endDate?: string;
  }) {
    return this.prisma.contract.create({
      data: {
        userId: data.userId,
        contractType: data.contractType,
        weeklyHours: data.weeklyHours,
        startDate: new Date(data.startDate),
        endDate: data.endDate ? new Date(data.endDate) : undefined,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.contract.update({ where: { id }, data });
  }
}