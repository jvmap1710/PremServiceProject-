const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const logs = await prisma.workLog.findMany({
    include: { request: { select: { title: true } } }
  });
  console.log(JSON.stringify(logs, null, 2));
  process.exit(0);
}
main();
