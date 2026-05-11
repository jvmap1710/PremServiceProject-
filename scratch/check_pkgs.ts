import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const packages = await prisma.premiumPackage.findMany({
    include: { client: true }
  });
  console.log('--- DANH SÁCH GÓI HỢP ĐỒNG ---');
  packages.forEach(p => {
    console.log(`- Khách: ${p.client.name}`);
    console.log(`  Gói: ${p.name}`);
    console.log(`  Giá: ${p.monthlyPrice}`);
    console.log(`  Từ: ${p.validFrom.toISOString()}`);
    console.log(`  Đến: ${p.validTo.toISOString()}`);
  });
}

main();
