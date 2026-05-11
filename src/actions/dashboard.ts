"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [totalRequests, doneRequests, inProgressRequests, allRequests] = await Promise.all([
    prisma.serviceRequest.count(),
    prisma.serviceRequest.count({ where: { status: "DONE" } }),
    prisma.serviceRequest.count({ where: { status: "IN_PROGRESS" } }),
    prisma.serviceRequest.findMany({
      include: {
        items: {
          include: { sroRule: true }
        }
      }
    })
  ]);

  // Calculate total consumed hours
  const totalHours = allRequests.reduce((acc, req) => {
    const reqHours = req.items.reduce((sum, item) => sum + (item.sroRule.estimateHours * (item.quantity || 1)), 0);
    return acc + reqHours;
  }, 0);

  // Stats by status for Pie Chart
  const statusCounts = [
    { name: "TODO", value: await prisma.serviceRequest.count({ where: { status: "TODO" } }) },
    { name: "IN_PROGRESS", value: inProgressRequests },
    { name: "DONE", value: doneRequests },
  ];

  // Stats by type for some insights
  const typeCounts = [
    { name: "TASK", value: await prisma.serviceRequest.count({ where: { type: "TASK" } }) },
    { name: "BUG", value: await prisma.serviceRequest.count({ where: { type: "BUG" } }) },
    { name: "FEATURE", value: await prisma.serviceRequest.count({ where: { type: "FEATURE" } }) },
    { name: "URGENT", value: await prisma.serviceRequest.count({ where: { type: "URGENT" } }) },
  ];

  return {
    totalRequests,
    doneRequests,
    inProgressRequests,
    totalHours,
    statusCounts,
    typeCounts,
    completionRate: totalRequests > 0 ? Math.round((doneRequests / totalRequests) * 100) : 0
  };
}
