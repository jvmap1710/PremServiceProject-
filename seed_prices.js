const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prisma = new PrismaClient();

async function main() {
  const clients = await prisma.client.findMany({
    include: { packages: true }
  });

  const now = new Date();
  console.log(`Processing ${clients.length} clients for annual packages...`);

  for (const client of clients) {
    console.log(`\n--- Client: ${client.name} (${client.code}) ---`);
    
    // 1. Determine base price for this client (Range 180M - 400M)
    let annualPrice = 0;
    if (client.code === 'SCB') annualPrice = 400000000;
    else if (client.code === 'GT') annualPrice = 250000000;
    else annualPrice = 180000000 + Math.floor(Math.random() * 120) * 1000000;

    const monthlyPrice = Math.floor(annualPrice / 12);
    
    // Dates for This Year (2026)
    const thisYearStart = new Date(2026, 0, 1);
    const thisYearEnd = new Date(2026, 11, 31);

    // Delete existing packages to start fresh (Cleanup)
    if (client.packages.length > 0) {
      await prisma.premiumPackage.deleteMany({
        where: { clientId: client.id }
      });
      console.log(`- Cleared ${client.packages.length} old packages.`);
    }

    // Create exactly one active package for 2026
    await prisma.premiumPackage.create({
      data: {
        clientId: client.id,
        name: `Premium Annual Package 2026`,
        validFrom: thisYearStart,
        validTo: thisYearEnd,
        isActive: true,
        monthlyPrice: monthlyPrice,
        monthlyQuota: 20 // Default quota
      }
    });
    
    console.log(`- Created Active Annual Package: ${new Intl.NumberFormat('vi-VN').format(monthlyPrice)}/month (~${new Intl.NumberFormat('vi-VN').format(annualPrice)}/year)`);
  }

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
