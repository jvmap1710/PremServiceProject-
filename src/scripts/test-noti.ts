import "dotenv/config";
import { prisma } from "../lib/prisma";

async function sendTest() {
  const user = await prisma.user.findUnique({ where: { username: 'JV' } });
  if (user) {
    await prisma.notification.create({
      data: {
        userId: user.id,
        title: '🚀 Hệ thống thông báo đã sẵn sàng!',
        message: 'Chào sếp! Amelia đã kích hoạt thành công tính năng nhắc việc tự động cho tài khoản Admin JV. Chúc sếp một ngày làm việc hiệu quả!',
        type: 'ASSIGNMENT',
        link: '/'
      }
    });
    console.log('✓ Đã bắn tin thành công cho Admin JV!');
  } else {
    console.log('X Không tìm thấy user JV');
  }
}

sendTest().then(() => prisma.$disconnect());
