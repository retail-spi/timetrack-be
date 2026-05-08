import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const adminUpdated = await prisma.user.updateMany({
    where: { email: 'admin@example.com' },
    data: { firstName: 'Sarah' },
  });
  console.log(`✅ Super Admin → Sarah (${adminUpdated.count} user)`);

  const managerUpdated = await prisma.user.updateMany({
    where: { email: 'manager@example.com' },
    data: { firstName: 'Admin', lastName: '' },
  });
  console.log(`✅ Manager → Admin (${managerUpdated.count} user)`);

  const hrDeleted = await prisma.user.deleteMany({
    where: { role: 'HR' },
  });
  console.log(`🗑️  Comptes HR supprimés : ${hrDeleted.count}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
