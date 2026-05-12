import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.update({
    where: { username: 'engineer1' },
    data: { role: 'IMP_ENGINEER' }
  });
  console.log('Updated user:', user.username, 'to role:', user.role);
}

main().catch(console.error).finally(() => prisma.$disconnect());
