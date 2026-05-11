const { PrismaClient } = require('@prisma/client');
const { PrismaMssql } = require('@prisma/adapter-mssql');

async function main() {
  const adapter = new PrismaMssql({
    server: process.env.DB_SERVER || "localhost",
    port: parseInt(process.env.DB_PORT || "1433"),
    database: process.env.DB_NAME || "PSManagement",
    user: process.env.DB_USER || "",
    password: process.env.DB_PASSWORD || "",
    options: {
      trustServerCertificate: true,
    },
  });

  const prisma = new PrismaClient({ adapter });
  const users = await prisma.user.findMany();
  console.log(JSON.stringify(users, null, 2));
  await prisma.$disconnect();
}

main();
