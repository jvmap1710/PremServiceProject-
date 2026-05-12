import { prisma } from './src/lib/prisma';

async function main() {
  const clients = await prisma.client.findMany({
    include: { packages: true }
  });

  console.log(`Processing ${clients.length} clients for annual packages...`);

  for (const client of clients) {
    console.log(`\n--- Client: ${client.name} (${client.code}) ---`);
    
    // 1. Determine annual price for this client (Range 180M - 400M)
    let annualPrice = 0;
    if (client.code === 'SCB') annualPrice = 400000000;
    else if (client.code === 'GT') annualPrice = 250000000;
    else annualPrice = 180000000 + Math.floor(Math.random() * 120) * 1000000;

    const monthlyPrice = Math.floor(annualPrice / 12);
    
    // Dates for This Year (2026)
    const thisYearStart = new Date(2026, 0, 1);
    const thisYearEnd = new Date(2026, 11, 31);

    // Update existing packages or create new one
    if (client.packages.length > 0) {
      // Update the first one to be the Active Annual Package
      await prisma.premiumPackage.update({
        where: { id: client.packages[0].id },
        data: {
          name: `Premium Annual Package 2026`,
          validFrom: thisYearStart,
          validTo: thisYearEnd,
          isActive: true,
          monthlyPrice: monthlyPrice,
          monthlyQuota: 20
        }
      });
      console.log(`- Updated package ${client.packages[0].id} to Active Annual.`);

      // Deactivate others
      if (client.packages.length > 1) {
        await prisma.premiumPackage.updateMany({
          where: { 
            clientId: client.id,
            id: { not: client.packages[0].id }
          },
          data: { isActive: false }
        });
        console.log(`- Deactivated ${client.packages.length - 1} other packages.`);
      }
    } else {
      // Create new one
      await prisma.premiumPackage.create({
        data: {
          clientId: client.id,
          name: `Premium Annual Package 2026`,
          validFrom: thisYearStart,
          validTo: thisYearEnd,
          isActive: true,
          monthlyPrice: monthlyPrice,
          monthlyQuota: 20
        }
      });
      console.log(`- Created new Active Annual Package.`);
    }
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
