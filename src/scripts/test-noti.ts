import "dotenv/config";
import { prisma } from "../lib/prisma";

async function sendTest() {
  const user = await prisma.user.findUnique({ where: { username: 'JV' } });
  if (user) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: '🚀 Notification system is ready!',
        message: 'Hello Boss! Amelia has successfully activated automatic task reminders for Admin JV account. Have a productive day!',
        type: 'ASSIGNMENT',
        link: '/'
      }
    });
    console.log('✓ Successfully sent message to Admin JV!');
  } else {
    console.log('X User JV not found');
  }
}

sendTest().then(() => prisma.$disconnect());
