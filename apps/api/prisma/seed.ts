import { PrismaClient, EmployeeScope, Role, ContractType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed démarré...');

  // ── Activity Types ────────────────────────────────────────────────────────
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
    await prisma.activityType.upsert({
      where: { code: at.code },
      update: { label: at.label },
      create: at,
    });
  }
  console.log('✅ ActivityTypes créés');

  // ── Task Types ────────────────────────────────────────────────────────────
  const taskTypes = [
    { code: 'FABRICATION',    label: 'Fabrication' },
    { code: 'INSTALLATION',   label: 'Installation' },
    { code: 'TRAVEL_TO_SITE', label: 'Trajet vers chantier' },
    { code: 'MAINTENANCE',    label: 'Maintenance' },
    { code: 'OTHER',          label: 'Autre' },
  ];

  for (const tt of taskTypes) {
    await prisma.taskType.upsert({
      where: { code: tt.code },
      update: { label: tt.label },
      create: tt,
    });
  }
  console.log('✅ TaskTypes créés');

  // ── Super Admin ───────────────────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: { firstName: 'Sarah', lastName: '' },
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Sarah',
      lastName: '',
      role: Role.SUPER_ADMIN,
      scope: EmployeeScope.employee_office,
    },
  });
  console.log(`✅ Super admin créé : ${admin.email}`);

  // ── Demo Users ────────────────────────────────────────────────────────────
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: { firstName: 'Admin', lastName: '' },
    create: {
      email: 'manager@example.com',
      passwordHash,
      firstName: 'Admin',
      lastName: '',
      role: Role.MANAGER,
      scope: EmployeeScope.employee_office,
    },
  });

  await prisma.user.upsert({
    where: { email: 'office@example.com' },
    update: {},
    create: {
      email: 'office@example.com',
      passwordHash,
      firstName: 'Jean',
      lastName: 'Martin',
      role: Role.EMPLOYEE,
      scope: EmployeeScope.employee_office,
      managerId: manager.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'commercial@example.com' },
    update: {},
    create: {
      email: 'commercial@example.com',
      passwordHash,
      firstName: 'Sophie',
      lastName: 'Leroy',
      role: Role.EMPLOYEE,
      scope: EmployeeScope.employee_commercial,
      managerId: manager.id,
    },
  });

  const worker = await prisma.user.upsert({
    where: { email: 'worker@example.com' },
    update: {},
    create: {
      email: 'worker@example.com',
      passwordHash,
      firstName: 'Paul',
      lastName: 'Ouvrier',
      role: Role.EMPLOYEE,
      scope: EmployeeScope.worker,
      managerId: manager.id,
    },
  });

  console.log('✅ Utilisateurs demo créés');

  // ── Contracts ─────────────────────────────────────────────────────────────
  const office     = await prisma.user.findUnique({ where: { email: 'office@example.com' } });
  const commercial = await prisma.user.findUnique({ where: { email: 'commercial@example.com' } });

  const contractDefs = [
    { userId: admin.id,        contractType: ContractType.HOURS_38, weeklyHours: 38 },
    { userId: manager.id,      contractType: ContractType.HOURS_20, weeklyHours: 20 },
    { userId: office?.id,      contractType: ContractType.HOURS_38, weeklyHours: 38 },
    { userId: commercial?.id,  contractType: ContractType.HOURS_38, weeklyHours: 38 },
    { userId: worker.id,       contractType: ContractType.HOURS_38, weeklyHours: 38 },
  ];

  for (const def of contractDefs) {
    if (!def.userId) continue;
    const existing = await prisma.contract.findFirst({ where: { userId: def.userId, isActive: true } });
    if (!existing) {
      await prisma.contract.create({
        data: { ...def, startDate: new Date('2026-01-01'), isActive: true },
      });
    }
  }
  console.log('✅ Contrats créés');

  // ── Project demo ──────────────────────────────────────────────────────────
  await prisma.project.upsert({
    where: { code: 'DEMO-001' },
    update: {},
    create: { name: 'Projet Démo', code: 'DEMO-001' },
  });
  console.log('✅ Projet demo créé');

  console.log('\n🎉 Seed terminé !');
  console.log('Comptes disponibles (mot de passe: ChangeMe123!):');
  console.log('  admin@example.com       → SUPER_ADMIN');
  console.log('  manager@example.com     → MANAGER / office');
  console.log('  office@example.com      → EMPLOYEE / office');
  console.log('  commercial@example.com  → EMPLOYEE / commercial');
  console.log('  worker@example.com      → EMPLOYEE / worker');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
