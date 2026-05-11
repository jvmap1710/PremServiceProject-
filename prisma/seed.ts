import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { addDays, subDays, startOfMonth, addMonths } from "date-fns";

async function main() {
  console.log("--- Bắt đầu quy trình Dọn dẹp & Khởi tạo dữ liệu mẫu ---");

  // 0. Dọn dẹp
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
  await prisma.globalSettings.deleteMany({});
  console.log("✓ Đã dọn dẹp sạch sẽ dữ liệu cũ.");

  const password = await bcrypt.hash("MotSys123", 10);
  const adminPassword = await bcrypt.hash("MotSys123@", 10);

  // 1. Cấu hình hệ thống
  await prisma.globalSettings.create({
    data: {
      id: "system",
      standardMonthlyHours: 176,
      revenueMode: "PACKAGE",
      revenuePerSroHour: 0
    }
  });
  console.log("✓ Đã tạo cấu hình hệ thống (176h).");

  // 2. Đảm bảo có tài khoản ADMIN JV
  const adminJV = await prisma.user.upsert({
    where: { username: "JV" },
    update: { role: "ADMIN", salary: 50000000 },
    create: {
      username: "JV",
      name: "Admin JV",
      password: adminPassword,
      role: "ADMIN",
      salary: 50000000
    },
  });

  // 3. Đảm bảo có tài khoản Engineer
  const engineer = await prisma.user.upsert({
    where: { username: "engineer1" },
    update: { salary: 25000000 },
    create: {
      username: "engineer1",
      name: "Kỹ thuật viên 01",
      password: password,
      role: "TAS",
      salary: 25000000
    },
  });

  const engineer2 = await prisma.user.upsert({
    where: { username: "engineer2" },
    update: { salary: 22000000 },
    create: {
      username: "engineer2",
      name: "Kỹ thuật viên 02",
      password: password,
      role: "TAS",
      salary: 22000000
    },
  });

  const assignees = [engineer.id, engineer2.id, adminJV.id];
  console.log("✓ Đã nạp nhân sự và lương mẫu.");

  // 4. Tạo Khách hàng BSL
  const bsl = await prisma.client.create({
    data: {
      name: "BIDV-SuMi TRUST Leasing Company (BSL)",
      code: "BSL",
      picName: "Phòng Dịch vụ Khách hàng BSL",
      picContact: "024 3928 4666",
      address: "Tầng 23, Tòa nhà TNR, 54A Nguyễn Chí Thanh, Đống Đa, Hà Nội",
      ownerId: adminJV.id
    }
  });

  const bslPackage = await prisma.premiumPackage.create({
    data: {
      name: "Premium Support BSL 2026",
      monthlyPrice: 180000000,
      validFrom: new Date(2026, 2, 27), // March 2026
      validTo: new Date(2027, 4, 11),
      clientId: bsl.id
    }
  });

  const bslRules = await Promise.all([
    prisma.sRORule.create({ data: { taskName: "Hỗ trợ Kỹ thuật On-site (Hà Nội)", estimateHours: 4, packageId: bslPackage.id } }),
    prisma.sRORule.create({ data: { taskName: "Bảo trì Hệ thống Tài chính định kỳ", estimateHours: 12, packageId: bslPackage.id } }),
    prisma.sRORule.create({ data: { taskName: "Update Security Patch Server", estimateHours: 8, packageId: bslPackage.id } })
  ]);

  // 5. Tạo Khách hàng SMC
  const smc = await prisma.client.create({
    data: {
      name: "SMC Manufacturing (Vietnam) Co., Ltd",
      code: "SMC",
      picName: "BP Quản lý Cơ sở hạ tầng SMC",
      picContact: "0251 3566 000",
      address: "Khu công nghiệp Long Đức, Xã Long Đức, Huyện Long Thành, Đồng Nai",
      ownerId: adminJV.id
    }
  });

  const smcP2025 = await prisma.premiumPackage.create({
    data: {
      name: "SMC Managed Services 2025",
      monthlyPrice: 250000000,
      validFrom: new Date(2025, 7, 18), 
      validTo: new Date(2026, 7, 17),
      clientId: smc.id,
      monthlyQuota: 100
    }
  });

  const smcP2026 = await prisma.premiumPackage.create({
    data: {
      name: "SMC Managed Services 2026 (Strategic)",
      monthlyPrice: 350000000,
      validFrom: new Date(2026, 7, 18),
      validTo: new Date(2027, 7, 17),
      clientId: smc.id,
      monthlyQuota: 150
    }
  });

  const smcRules = await Promise.all([
    prisma.sRORule.create({ data: { taskName: "IoT Gateway Module Support", estimateHours: 16, packageId: smcP2025.id } }),
    prisma.sRORule.create({ data: { taskName: "Automation System Optimization", estimateHours: 24, packageId: smcP2025.id } }),
    prisma.sRORule.create({ data: { taskName: "Factory Network Troubleshooting", estimateHours: 4, packageId: smcP2026.id } })
  ]);
  console.log("✓ Đã tạo xong BSL & SMC (Khách hàng, Gói, Quy tắc).");

  // 6. Tạo 30 Ticket mẫu rải rác các tháng
  console.log("--- Bắt đầu tạo 30 Ticket mẫu ---");
  const clients = [bsl, smc];
  
  for (let i = 0; i < 30; i++) {
    const client = clients[i % clients.length];
    const pkg = client.id === bsl.id ? bslPackage : (i < 15 ? smcP2025 : smcP2026);
    const ruleSet = client.id === bsl.id ? bslRules : smcRules;
    const rule = ruleSet[Math.floor(Math.random() * ruleSet.length)];
    
    // Rải rác từ tháng 8/2025 đến tháng 5/2026
    const baseDate = new Date(2025, 7, 1); // Aug 2025
    const ticketDate = addDays(addMonths(baseDate, Math.floor(i / 3)), (i % 3) * 7);
    
    if (ticketDate > new Date(2026, 5, 1)) continue; // Không quá xa tương lai

    const status = ticketDate < new Date() ? "DONE" : "TODO";
    
    const request = await prisma.serviceRequest.create({
      data: {
        code: `${client.code}-${(i + 1).toString().padStart(3, '0')}`,
        title: `Hỗ trợ Premium định kỳ - Lần ${i + 1}`,
        description: `Mô tả chi tiết công việc cho ticket ${client.code} tháng ${ticketDate.getMonth() + 1}`,
        status: status,
        type: i % 5 === 0 ? "BUG" : "TASK",
        priority: i % 10 === 0 ? "HIGH" : "MEDIUM",
        clientId: client.id,
        packageId: pkg.id,
        createdById: adminJV.id,
        assigneeId: assignees[i % assignees.length],
        raiseDate: ticketDate,
        deadline: addDays(ticketDate, 5),
        items: { create: { sroRuleId: rule.id, quantity: 1 } }
      }
    });

    // Tạo WorkLog cho các ticket DONE
    if (status === "DONE") {
      const actHours = rule.estimateHours * (0.8 + Math.random() * 0.4); // +/- 20%
      await prisma.workLog.create({
        data: {
          requestId: request.id,
          userId: request.assigneeId,
          hours: actHours,
          description: "Thực hiện xử lý theo SRO định mức.",
          logDate: ticketDate
        }
      });
    }
  }

  console.log("✓ Đã nạp 30 Ticket mẫu kèm WorkLogs.");
  console.log("--- HOÀN TẤT DỮ LIỆU MẪU ---");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("!!! LỖI SEED NGHIÊM TRỌNG !!!");
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
