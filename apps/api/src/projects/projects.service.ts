import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.project.findMany({
      include: { team: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Projet introuvable');
    return project;
  }

  async create(data: { name: string; code: string; teamId?: string }) {
    return this.prisma.project.create({ data });
  }

  async update(id: string, data: any) {
    return this.prisma.project.update({ where: { id }, data });
  }

  async remove(id: string) {
    return this.prisma.project.delete({ where: { id } });
  }

  async getStats(projectId: string) {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new (await import('@nestjs/common')).NotFoundException('Projet introuvable');

    const entries = await this.prisma.workerTimeEntry.findMany({
      where: { projectId, status: { not: 'REJECTED' } },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        taskType: { select: { id: true, label: true } },
      },
    });

    const totalHours = entries.reduce((s, e) => s + e.hours, 0);

    const workerMap = new Map<string, { firstName: string; lastName: string; hours: number }>();
    for (const e of entries) {
      const key = e.user.id;
      const prev = workerMap.get(key) ?? { firstName: e.user.firstName, lastName: e.user.lastName, hours: 0 };
      workerMap.set(key, { ...prev, hours: prev.hours + e.hours });
    }

    const taskMap = new Map<string, { label: string; hours: number }>();
    for (const e of entries) {
      const key = e.taskType.id;
      const prev = taskMap.get(key) ?? { label: e.taskType.label, hours: 0 };
      taskMap.set(key, { ...prev, hours: prev.hours + e.hours });
    }

    return {
      project,
      totalHours,
      byWorker: Array.from(workerMap.values()).sort((a, b) => b.hours - a.hours),
      byTaskType: Array.from(taskMap.values()).sort((a, b) => b.hours - a.hours),
    };
  }

  async importMany(rows: { name: string; code: string }[]) {
    const results = await Promise.all(
      rows.map(({ name, code }) =>
        this.prisma.project.upsert({
          where: { code },
          update: { name },
          create: { name, code },
        }),
      ),
    );
    return { count: results.length };
  }
}