import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { getISOWeek, getISOWeekYear } from 'date-fns';

@Injectable()
export class AlertsService {
  constructor(private readonly prisma: PrismaService) {}

  private getWeekKey(date: Date): string {
    const week = getISOWeek(date);
    const year = getISOWeekYear(date);
    return `${year}-W${String(week).padStart(2, '0')}`;
  }

  async checkWeeklyHours(userId: string, date: Date): Promise<void> {
    const weekKey = this.getWeekKey(date);

    // Récupérer le contrat actif
    const contract = await this.prisma.contract.findFirst({
      where: { userId, isActive: true },
    });

    if (!contract) return;

    // Calculer debut/fin de semaine ISO
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1);
    startOfWeek.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    let totalHours = 0;

    if (user?.scope === 'worker') {
      const entries = await this.prisma.workerTimeEntry.findMany({
        where: { userId, date: { gte: startOfWeek, lte: endOfWeek } },
      });
      totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
    } else {
      const entries = await this.prisma.timeEntry.findMany({
        where: { userId, date: { gte: startOfWeek, lte: endOfWeek } },
      });
      totalHours = entries.reduce((sum, e) => {
        const diff = (e.endTime.getTime() - e.startTime.getTime()) / 3600000;
        return sum + diff - e.breakMinutes / 60;
      }, 0);
    }

    if (totalHours > contract.weeklyHours) {
      // Éviter doublons
      const existing = await this.prisma.alert.findFirst({
        where: { userId, week: weekKey, isRead: false },
      });
      if (!existing) {
        await this.prisma.alert.create({
          data: {
            userId,
            week: weekKey,
            message: `Dépassement horaire semaine ${weekKey} : ${totalHours.toFixed(1)}h / ${contract.weeklyHours}h`,
          },
        });
      }
    }
  }
}
