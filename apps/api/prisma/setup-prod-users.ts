// Script de migration vers les vrais utilisateurs — SPI Global Play Retail 2026
// Usage : npx ts-node -r tsconfig-paths/register prisma/setup-prod-users.ts
import * as dotenv from 'dotenv';
dotenv.config({ path: '../../.env' });

import { PrismaClient, EmployeeScope, Role, ContractType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function findByEmailEither(oldEmail: string, newEmail: string) {
  return (
    (await prisma.user.findUnique({ where: { email: newEmail } })) ||
    (await prisma.user.findUnique({ where: { email: oldEmail } }))
  );
}

async function ensureContract(userId: string, weeklyHours: number, type: ContractType) {
  const existing = await prisma.contract.findFirst({ where: { userId, isActive: true } });
  if (!existing) {
    await prisma.contract.create({
      data: { userId, contractType: type, weeklyHours, startDate: new Date('2026-01-01'), isActive: true },
    });
    return 'créé';
  }
  return 'existant';
}

async function main() {
  console.log('🔄 Migration vers les vrais utilisateurs...\n');

  const passwordHash = await bcrypt.hash('ChangeMe123!', 12);

  // ── 1. Sarah — SUPER_ADMIN ────────────────────────────────────────────────
  let sarah = await findByEmailEither('admin@example.com', 'sarah@spiglobalplay.com');
  if (sarah) {
    sarah = await prisma.user.update({
      where: { id: sarah.id },
      data: { email: 'sarah@spiglobalplay.com', firstName: 'Sarah', lastName: '' },
    });
    console.log(`✅ Sarah mise à jour → ${sarah.email}`);
  } else {
    sarah = await prisma.user.create({
      data: {
        email: 'sarah@spiglobalplay.com',
        passwordHash,
        firstName: 'Sarah',
        lastName: '',
        role: Role.SUPER_ADMIN,
        scope: EmployeeScope.employee_office,
      },
    });
    console.log(`✅ Sarah créée → ${sarah.email}`);
  }
  await ensureContract(sarah.id, 38, ContractType.HOURS_38);

  // ── 2. François — MANAGER ─────────────────────────────────────────────────
  let francois = await findByEmailEither('manager@example.com', 'retail@spiglobalplay.com');
  if (francois) {
    francois = await prisma.user.update({
      where: { id: francois.id },
      data: { email: 'retail@spiglobalplay.com', firstName: 'François', lastName: 'Dive' },
    });
    console.log(`✅ François mis à jour → ${francois.email}`);
  } else {
    francois = await prisma.user.create({
      data: {
        email: 'retail@spiglobalplay.com',
        passwordHash,
        firstName: 'François',
        lastName: 'Dive',
        role: Role.MANAGER,
        scope: EmployeeScope.employee_office,
      },
    });
    console.log(`✅ François créé → ${francois.email}`);
  }
  await ensureContract(francois.id, 20, ContractType.HOURS_20);

  // ── 3. Employés réels ─────────────────────────────────────────────────────
  const employees = [
    { email: 'af@sport-base.be',           firstName: 'Arno',      lastName: '', scope: EmployeeScope.employee_office,      hours: 38 },
    { email: 'ah@sport-base.be',           firstName: 'Abdel',     lastName: '', scope: EmployeeScope.employee_office,      hours: 38 },
    { email: 'danny@spiglobalplay.com',    firstName: 'Danny',     lastName: '', scope: EmployeeScope.employee_office,      hours: 38 },
    { email: 'dominique@spiglobalplay.com',firstName: 'Dominique', lastName: '', scope: EmployeeScope.employee_commercial,  hours: 38 },
  ];

  for (const emp of employees) {
    let user = await prisma.user.findUnique({ where: { email: emp.email } });
    if (user) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { firstName: emp.firstName, lastName: emp.lastName, managerId: francois.id },
      });
      console.log(`✅ ${emp.firstName} mis à jour → ${user.email}`);
    } else {
      user = await prisma.user.create({
        data: {
          email: emp.email,
          passwordHash,
          firstName: emp.firstName,
          lastName: emp.lastName,
          role: Role.EMPLOYEE,
          scope: emp.scope,
          managerId: francois.id,
        },
      });
      console.log(`✅ ${emp.firstName} créé → ${user.email}`);
    }
    const c = await ensureContract(user.id, emp.hours, ContractType.HOURS_38);
    console.log(`   Contrat 38h : ${c}`);
  }

  // ── 4. Désactiver les comptes démo obsolètes ──────────────────────────────
  const demoEmails = ['office@example.com', 'commercial@example.com', 'worker@example.com'];
  for (const email of demoEmails) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u && u.isActive) {
      await prisma.user.update({ where: { id: u.id }, data: { isActive: false } });
      console.log(`🔴 Compte démo désactivé : ${email}`);
    }
  }

  console.log('\n🎉 Migration terminée !');
  console.log('Comptes actifs (mot de passe : ChangeMe123!) :');
  console.log('  sarah@spiglobalplay.com         → SUPER_ADMIN');
  console.log('  retail@spiglobalplay.com        → MANAGER (François Dive)');
  console.log('  af@sport-base.be                → EMPLOYEE / Bureau (Arno)');
  console.log('  ah@sport-base.be                → EMPLOYEE / Bureau (Abdel)');
  console.log('  danny@spiglobalplay.com         → EMPLOYEE / Bureau (Danny)');
  console.log('  dominique@spiglobalplay.com     → EMPLOYEE / Commercial (Dominique)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
