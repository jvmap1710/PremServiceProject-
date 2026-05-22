import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";
import { addDays, subDays, startOfMonth, addMonths } from "date-fns";

async function main() {
  console.log("--- Starting Cleanup & Mock Data Seeding ---");

  // 0. Cleanup
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
  await prisma.kanbanColumn.deleteMany({});
  console.log("✓ Successfully cleaned up old data (including KanbanColumn).");

  const password = await bcrypt.hash("MotSys123", 10);
  const adminPassword = await bcrypt.hash("MotSys123@", 10);

  // 1. System Config
  await prisma.globalSettings.create({
    data: {
      id: "system",
      standardMonthlyHours: 176,
      revenueMode: "PACKAGE",
      revenuePerSroHour: 0
    }
  });
  console.log("✓ Created system settings (176h).");

  // 2. Ensure Admin JV Account exists
  const adminJV = await prisma.user.upsert({
    where: { username: "JV" },
    update: { role: "ADMIN", salary: 50000000, password: adminPassword },
    create: {
      username: "JV",
      name: "Admin JV",
      password: adminPassword,
      role: "ADMIN",
      salary: 50000000
    },
  });

  // 3. Ensure Engineer Accounts exist
  const engineer = await prisma.user.upsert({
    where: { username: "engineer1" },
    update: { salary: 25000000, password: password },
    create: {
      username: "engineer1",
      name: "Technician 01",
      password: password,
      role: "TAS",
      salary: 25000000
    },
  });

  const engineer2 = await prisma.user.upsert({
    where: { username: "engineer2" },
    update: { salary: 22000000, password: password },
    create: {
      username: "engineer2",
      name: "Technician 02",
      password: password,
      role: "TAS",
      salary: 22000000
    },
  });

  const assignees = [engineer.id, engineer2.id, adminJV.id];
  console.log("✓ Seeded staff and mock salaries.");

  // 4. Create Client BSL
  const bsl = await prisma.client.create({
    data: {
      name: "BIDV-SuMi TRUST Leasing Company (BSL)",
      code: "BSL",
      picName: "BSL Customer Service Department",
      picContact: "024 3928 4666",
      address: "23rd Floor, TNR Tower, 54A Nguyen Chi Thanh, Dong Da, Hanoi",
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
    prisma.sRORule.create({ data: { taskName: "On-site Technical Support (Hanoi)", estimateHours: 4, packageId: bslPackage.id } }),
    prisma.sRORule.create({ data: { taskName: "Periodic Financial System Maintenance", estimateHours: 12, packageId: bslPackage.id } }),
    prisma.sRORule.create({ data: { taskName: "Update Security Patch Server", estimateHours: 8, packageId: bslPackage.id } })
  ]);

  // 5. Create Client SMC
  const smc = await prisma.client.create({
    data: {
      name: "SMC Manufacturing (Vietnam) Co., Ltd",
      code: "SMC",
      picName: "SMC Infrastructure Management Department",
      picContact: "0251 3566 000",
      address: "Long Duc Industrial Park, Long Duc Ward, Long Thanh District, Dong Nai Province",
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
  console.log("✓ Successfully created BSL & SMC (Clients, Packages, Rules).");

  // 6. Create 30 Mock Tickets scattered across months
  console.log("--- Starting creation of 30 Mock Tickets ---");
  const clients = [bsl, smc];
  
  for (let i = 0; i < 30; i++) {
    const client = clients[i % clients.length];
    const pkg = client.id === bsl.id ? bslPackage : (i < 15 ? smcP2025 : smcP2026);
    const ruleSet = client.id === bsl.id ? bslRules : smcRules;
    const rule = ruleSet[Math.floor(Math.random() * ruleSet.length)];
    
    // Scattered from August 2025 to May 2026
    const baseDate = new Date(2025, 7, 1); // Aug 2025
    const ticketDate = addDays(addMonths(baseDate, Math.floor(i / 3)), (i % 3) * 7);
    
    if (ticketDate > new Date(2026, 5, 1)) continue; // Not too far in the future

    const status = ticketDate < new Date() ? "DONE" : "TODO";
    
    const ticketType = i % 6 === 0 ? "INCIDENT" : 
                       i % 6 === 1 ? "PROBLEM" : 
                       i % 6 === 2 ? "SRO" : 
                       i % 6 === 3 ? "NSRO" : 
                       i % 6 === 4 ? "OTHERS" : "HEALTH_CHECK";
    
    const isIncidentOrProblem = ticketType === "INCIDENT" || ticketType === "PROBLEM";
    const urgency = isIncidentOrProblem 
      ? (i % 4 === 0 ? "IMMEDIATE" : i % 4 === 1 ? "URGENT" : i % 4 === 2 ? "MODERATE" : "STANDARD") 
      : null;
    const impact = isIncidentOrProblem 
      ? (i % 4 === 0 ? "WIDESPREAD" : i % 4 === 1 ? "LARGE" : i % 4 === 2 ? "LIMITED" : "LOCALISED") 
      : null;

    const request = await prisma.serviceRequest.create({
      data: {
        code: `${client.code}-${(i + 1).toString().padStart(3, '0')}`,
        title: `Regular Premium Support - Occasion ${i + 1}`,
        description: `Detailed task description for ticket ${client.code} month ${ticketDate.getMonth() + 1}`,
        status: status,
        type: ticketType,
        priority: i % 4 === 0 ? "P1" : i % 4 === 1 ? "P2" : i % 4 === 2 ? "P3" : "P4",
        urgency: urgency as any,
        impact: impact as any,
        clientId: client.id,
        packageId: pkg.id,
        createdById: adminJV.id,
        assigneeId: assignees[i % assignees.length],
        raiseDate: ticketDate,
        deadline: addDays(ticketDate, 5),
        items: { create: { sroRuleId: rule.id, quantity: 1 } }
      } as any
    });

    // Create WorkLog for DONE tickets
    if (status === "DONE") {
      const actHours = rule.estimateHours * (0.8 + Math.random() * 0.4); // +/- 20%
      await prisma.workLog.create({
        data: {
          requestId: request.id,
          userId: request.assigneeId,
          hours: actHours,
          description: "Standard SRO processing.",
          logDate: ticketDate
        }
      });
    }
  }

  console.log("✓ Seeded 30 Mock Tickets with WorkLogs.");
  console.log("--- MOCK DATA SEEDING COMPLETE ---");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("!!! CRITICAL SEED ERROR !!!");
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
