import { prisma } from '../src/lib/prisma';

async function main() {
  console.log('Starting seed sample data for reports...');

  // 0. Clean up existing data for these clients to avoid unique constraint errors
  const sampleClientCodes = ['SCB', 'GT', 'VNG'];
  await prisma.workLog.deleteMany({
    where: { request: { client: { code: { in: sampleClientCodes } } } }
  });
  await prisma.serviceRequest.deleteMany({
    where: { client: { code: { in: sampleClientCodes } } }
  });

  // 1. Ensure we have users (SROs)
  const users = [
    { username: 'nguyen.van.a', name: 'Nguyễn Văn A', role: 'TAS' },
    { username: 'tran.thi.b', name: 'Trần Thị B', role: 'TAS' },
    { username: 'le.van.c', name: 'Lê Văn C', role: 'IMP_ENGINEER' },
    { username: 'pham.thi.d', name: 'Phạm Thị D', role: 'IMP_ENGINEER' },
    { username: 'hoang.van.e', name: 'Hoàng Văn E', role: 'IMP_ENGINEER' },
    { username: 'boss', name: 'Boss', role: 'MANAGER' },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { username: u.username },
      update: { role: u.role },
      create: {
        username: u.username,
        name: u.name,
        password: 'password123',
        role: u.role
      }
    });
  }

  const allUsers = await prisma.user.findMany();

  // 2. Ensure we have clients and packages
  const clientsData = [
    { name: 'SCB Bank', code: 'SCB' },
    { name: 'Golden Trust', code: 'GT' },
    { name: 'VNG Corporation', code: 'VNG' },
  ];

  for (const c of clientsData) {
    const client = await prisma.client.upsert({
      where: { code: c.code },
      update: {},
      create: { name: c.name, code: c.code }
    });

    let pkg = await prisma.premiumPackage.findFirst({
      where: { clientId: client.id }
    });

    if (!pkg) {
      pkg = await prisma.premiumPackage.create({
        data: {
          name: `Package Premium ${c.code}`,
          clientId: client.id,
          validFrom: new Date('2025-01-01'),
          validTo: new Date('2027-12-31'),
          monthlyQuota: 100,
          sroRules: {
            create: [
              { taskName: 'Fix Bug', estimateHours: 2.0 },
              { taskName: 'Update Content', estimateHours: 1.0 },
              { taskName: 'New Feature', estimateHours: 4.0 },
              { taskName: 'Urgent Support', estimateHours: 0.5 },
            ]
          }
        }
      });
    }

    const rules = await prisma.sRORule.findMany({ where: { packageId: pkg.id } });

    // 3. Create Sample Requests spread over 12 months
    const now = new Date();
    const months = 12;
    const types = ['BUG', 'FEATURE', 'TASK', 'URGENT'];
    const statuses = ['DONE', 'DONE', 'DONE', 'TODO', 'IN_PROGRESS']; // Weighted towards DONE

    for (let i = 0; i < months; i++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 15);
      const ticketCount = 5 + Math.floor(Math.random() * 10); // 5-15 tickets per month

      for (let j = 0; j < ticketCount; j++) {
        const type = types[Math.floor(Math.random() * types.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const rule = rules[Math.floor(Math.random() * rules.length)];
        const assignee = allUsers[Math.floor(Math.random() * allUsers.length)];
        
        const raiseDate = new Date(monthDate);
        raiseDate.setDate(1 + Math.floor(Math.random() * 28));
        
        const deadline = new Date(raiseDate);
        deadline.setDate(raiseDate.getDate() + 3); // 3 days SLA

        const request = await prisma.serviceRequest.create({
          data: {
            code: `PREM-${c.code}-${i}-${j}`,
            clientId: client.id,
            packageId: pkg.id,
            title: `Sample ${type} for ${c.name} - ${j}`,
            description: `Description for ${type} request`,
            type: type as any,
            status: status as any,
            raiseDate: raiseDate,
            deadline: deadline,
            assigneeId: assignee.id,
            items: {
              create: {
                sroRuleId: rule.id,
                quantity: 1
              }
            }
          }
        });

        // 4. Create WorkLogs for DONE/IN_PROGRESS
        if (status !== 'TODO') {
          const logDate = new Date(raiseDate);
          logDate.setHours(raiseDate.getHours() + 2);
          
          // Randomize Actual vs Estimate for efficiency reporting
          const isLate = Math.random() > 0.8; // 20% late for SLA test
          const actLogDate = new Date(logDate);
          if (isLate && status === 'DONE') {
             actLogDate.setDate(deadline.getDate() + 1);
          }

          await prisma.workLog.create({
            data: {
              requestId: request.id,
              userId: assignee.id,
              hours: rule.estimateHours * (0.8 + Math.random() * 0.5), // 80% to 130% of estimate
              logDate: status === 'DONE' ? actLogDate : logDate,
              description: 'Completed work'
            }
          });
        }
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
