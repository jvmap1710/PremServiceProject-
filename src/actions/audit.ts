"use server";

import { prisma } from "@/lib/prisma";

export async function getAuditLogs(requestId: string) {
  try {
    const logs = await prisma.auditLog.findMany({
      where: { requestId },
      include: {
        user: { select: { name: true, role: true } }
      },
      orderBy: { createdAt: "desc" }
    });
    return logs;
  } catch (error: any) {
    console.error("Fetch audit logs error:", error);
    return [];
  }
}
