import { PrismaClient, ContractType } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

const prisma = new PrismaClient();

const targets = [
  { email: 'office@example.com',     weeklyHours: 38, contractType: ContractType.HOURS_38 },
  { email: 'commercial@example.com', weeklyHours: 38, contractType: ContractType.HOURS_38 },
  { email: 'admin@example.com',      weeklyHours: 38, contractType: ContractType.HOURS_38 },
];

async function main() {
  for (const t of targets) {
    const user = await prisma.user.findUnique({ where: { email: t.email } });
    if (!user) { console.log(`⚠️  Utilisateur introuvable : ${t.email}`); continue; }

    const existing = await prisma.contract.findFirst({ where: { userId: user.id, isActive: true } });
    if (existing) {
      console.log(`⏭️  Contrat déjà existant pour ${user.firstName} ${user.lastName} (${t.email})`);
      continue;
    }

    await prisma.contract.create({
      data: {
        userId:       user.id,
        contractType: t.contractType,
        weeklyHours:  t.weeklyHours,
        startDate:    new Date('2026-01-01'),
        isActive:     true,
      },
    });
    console.log(`✅ Contrat ${t.weeklyHours}h créé pour ${user.firstName} ${user.lastName} (${t.email})`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
