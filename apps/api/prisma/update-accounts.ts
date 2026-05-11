import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const newActivityTypes = [
  { code: 'OFFICE',   label: 'Bureau' },
  { code: 'TRAVEL',   label: 'Déplacement' },
  { code: 'EVENT',    label: 'Évènement' },
  { code: 'LEAVE',    label: 'Congé' },
  { code: 'SICK',     label: 'Maladie' },
  { code: 'ABSENCE',  label: 'Absence' },
];

async function main() {
  const adminUpdated = await prisma.user.updateMany({
    where: { role: 'SUPER_ADMIN' },
    data: { firstName: 'Sarah', lastName: '' },
  });
  console.log(`✅ SUPER_ADMIN → Sarah (${adminUpdated.count} user(s))`);

  const managerUpdated = await prisma.user.updateMany({
    where: { role: 'MANAGER' },
    data: { firstName: 'Admin', lastName: '' },
  });
  console.log(`✅ MANAGER → Admin (${managerUpdated.count} user(s))`);

  const hrDeleted = await prisma.user.deleteMany({
    where: { role: 'HR' },
  });
  console.log(`🗑️  Comptes HR supprimés : ${hrDeleted.count}`);

  // Désactive tous les anciens types d'activité
  await prisma.activityType.updateMany({ data: { isActive: false } });

  // Upsert les nouveaux
  for (const at of newActivityTypes) {
    await prisma.activityType.upsert({
      where: { code: at.code },
      update: { label: at.label, isActive: true },
      create: { ...at, isActive: true },
    });
  }
  console.log(`✅ Activity types mis à jour : ${newActivityTypes.map(a => a.label).join(', ')}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
