const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

// Truyền trực tiếp URL vào đây để đảm bảo kết nối thành công trên Windows
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "sqlserver://localhost:1433;database=PSManagement;user=psmcreator;password=MotSys123@;trustServerCertificate=true"
    }
  }
});

async function purgeAndSeed() {
  console.log("--- Bắt đầu dọn dẹp hệ thống ---");

  try {
    // 1. Xóa toàn bộ dữ liệu giao dịch và cấu hình mẫu
    await prisma.workLog.deleteMany({});
    await prisma.comment.deleteMany({});
    await prisma.attachment.deleteMany({});
    await prisma.auditLog.deleteMany({});
    await prisma.notification.deleteMany({});
    await prisma.serviceRequestItem.deleteMany({});
    await prisma.serviceRequest.deleteMany({});
    await prisma.sRORule.deleteMany({});
    await prisma.premiumPackage.deleteMany({});
    await prisma.client.deleteMany({});
    console.log("✓ Đã xóa sạch Requests, Logs, Clients và Packages.");

    // 2. Xóa tất cả User trừ 'JV'
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        username: { not: "JV" }
      }
    });
    console.log(`✓ Đã xóa ${deletedUsers.count} tài khoản cũ (Giữ lại JV).`);

    // 3. Tạo 4 tài khoản mới
    const newUsers = [
      { name: "NGUYEN THI HUYEN LINH", username: "linhnth", role: "TAS" },
      { name: "LE NGOC THAO QUYEN", username: "quyenlnt", role: "TAS" },
      { name: "Ho Duc Tri", username: "trihd", role: "TAS" },
      { name: "Nguyen Duy", username: "nguyenduy", role: "MANAGER" },
    ];

    const password = await bcrypt.hash("MotSys123", 10);

    for (const u of newUsers) {
      await prisma.user.create({
        data: {
          name: u.name,
          username: u.username,
          password: password,
          role: u.role
        }
      });
      console.log(`+ Đã tạo tài khoản: ${u.username} (${u.role})`);
    }

    console.log("--- HOÀN TẤT TỔNG VỆ SINH ---");
  } catch (error) {
    console.error("Lỗi thực thi kịch bản:", error);
  } finally {
    await prisma.$disconnect();
  }
}

purgeAndSeed();
