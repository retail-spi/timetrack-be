import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const activityTypes = [
    { code: 'OFFICE',       label: 'Bureau' },
    { code: 'TRAVEL',       label: 'Déplacement' },
    { code: 'EVENT',        label: 'Évènement' },
    { code: 'LEAVE',        label: 'Congé' },
    { code: 'SICK',         label: 'Maladie' },
    { code: 'ABSENCE',      label: 'Absence' },
    { code: 'HOLIDAY_COMP', label: 'Récupération jour férié' },
  ];

  for (const at of activityTypes) {
    await prisma.activityType.upsert({ where: { code: at.code }, update: { label: at.label }, create: at });
  }
  console.log('✅ ActivityTypes créés');

  const taskTypes = [
    { code: 'FABRICATION',    label: 'Fabrication' },
    { code: 'INSTALLATION',   label: 'Installation' },
    { code: 'TRAVEL_TO_SITE', label: 'Trajet vers chantier' },
    { code: 'MAINTENANCE',    label: 'Maintenance' },
    { code: 'OTHER',          label: 'Autre' },
  ];

  for (const tt of taskTypes) {
    await prisma.taskType.upsert({ where: { code: tt.code }, update: { label: tt.label }, create: tt });
  }
  console.log('✅ TaskTypes créés');
}

main().catch(console.error).finally(() => prisma.$disconnect());
