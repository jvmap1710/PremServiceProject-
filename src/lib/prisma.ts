import { PrismaMssql } from "@prisma/adapter-mssql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

function createPrismaClient() {
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

  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma || createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
