const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing database connection...");
    const userCount = await prisma.user.count();
    console.log(`Connection successful. User count: ${userCount}`);
    
    console.log("Testing Notification table...");
    const notifCount = await prisma.notification.count();
    console.log(`Notification table found. Notification count: ${notifCount}`);
  } catch (error) {
    console.error("Database connection failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
