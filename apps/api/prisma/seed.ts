import { PrismaClient, EmployeeScope, Role, ContractType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed démarré...');

  // ── Activity Types ────────────────────────────────────────────────────────
  const activityTypes = [
    { code: 'CLIENT_MEETING', label: 'Réunion client' },
    { code: 'TRAVEL',         label: 'Déplacement' },
    { code: 'ADMIN_WORK',     label: 'Travail administratif' },
    { code: 'OFFICE',         label: 'Travail bureau' },
    { code: 'EVENT',          label: 'Événement' },
    { code: 'OTHER',          label: 'Autre' },
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
    update: {},
    create: {
      email: 'admin@example.com',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.SUPER_ADMIN,
      scope: EmployeeScope.employee_office,
    },
  });
  console.log(`✅ Super admin créé : ${admin.email}`);

  // ── Demo Users ────────────────────────────────────────────────────────────
  const manager = await prisma.user.upsert({
    where: { email: 'manager@example.com' },
    update: {},
    create: {
      email: 'manager@example.com',
      passwordHash,
      firstName: 'Marie',
      lastName: 'Dupont',
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
  const users = [manager.id, worker.id];
  for (const uid of users) {
    await prisma.contract.create({
      data: {
        userId: uid,
        contractType: ContractType.HOURS_38,
        weeklyHours: 38,
        startDate: new Date('2024-01-01'),
        isActive: true,
      },
    });
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
