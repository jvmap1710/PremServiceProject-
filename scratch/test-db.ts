import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Testing database connection...");
    const userCount = await prisma.user.count();
    console.log(`Connection successful. User count: ${userCount}`);
    
    console.log("Testing Notification table...");
    const notifCount = await prisma.notification.count();
    console.log(`Notification table found. Notification count: ${notifCount}`);
    
    // Try to fetch notifications for the first user
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      console.log(`Testing fetch for user: ${firstUser.username}`);
      const notifs = await prisma.notification.findMany({
        where: { userId: firstUser.id },
        take: 5
      });
      console.log(`Successfully fetched ${notifs.length} notifications.`);
    }
  } catch (error) {
    console.error("Database test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
