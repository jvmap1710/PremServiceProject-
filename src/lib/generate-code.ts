import { prisma } from "@/lib/prisma";

export async function generateTicketCode(clientId: string, clientCode: string, raiseDate: Date = new Date()) {
  const year = raiseDate.getFullYear();
  
  // Try to find the last request for this client in the given year
  const lastRequest = await prisma.serviceRequest.findFirst({
    where: { 
      clientId,
      code: { endsWith: `-${year}` }
    },
    orderBy: { code: 'desc' },
    select: { code: true }
  });

  let nextNumber = 1;

  if (lastRequest && lastRequest.code) {
    const parts = lastRequest.code.split('-');
    if (parts.length >= 3) {
      // Format: CLIENT-001-2024 -> sequence is at index length - 2
      const seqStr = parts[parts.length - 2];
      const lastNum = parseInt(seqStr, 10);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
  } else {
    // If no tickets found for this year, maybe they used the legacy format (e.g. CLIENT-001)
    // and we want to continue the sequence instead of resetting? 
    // Usually, appending the year means resetting per year. Let's reset per year (starts at 1).
  }

  return `${clientCode}-${nextNumber.toString().padStart(3, '0')}-${year}`;
}
