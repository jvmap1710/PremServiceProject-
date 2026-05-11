import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const requests = await prisma.serviceRequest.findMany({
    where: {
      code: { in: ["TEST-001-002", "TEST-001-004"] }
    },
    include: {
      workLogs: true,
      items: {
        include: {
          sroRule: true
        }
      }
    }
  });

  console.log(JSON.stringify(requests, null, 2));
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
