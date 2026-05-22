"use server";

import { prisma } from "@/lib/prisma";

export async function getDashboardStats() {
  const [statusGroups, typeGroups, allRequests] = await Promise.all([
    // Group by status to get all counts in one go
    prisma.serviceRequest.groupBy({
      by: ['status'],
      _count: true
    }),
    // Group by type to get all counts in one go
    prisma.serviceRequest.groupBy({
      by: ['type'],
      _count: true
    }),
    // Still need this for hours calculation until we have a more complex SQL view
    prisma.serviceRequest.findMany({
      include: {
        items: {
          include: { sroRule: true }
        }
      }
    })
  ]);

  const totalRequests = allRequests.length;
  const doneRequests = statusGroups.find(g => g.status === "DONE")?._count || 0;
  const inProgressRequests = statusGroups.find(g => g.status === "IN_PROGRESS")?._count || 0;

  // Calculate total consumed hours
  const totalHours = allRequests.reduce((acc, req) => {
    const reqHours = req.items.reduce((sum, item) => sum + (item.sroRule.estimateHours * (item.quantity || 1)), 0);
    return acc + reqHours;
  }, 0);

  // Map groups to the expected format for charts
  const statusCounts = ["TODO", "IN_PROGRESS", "DONE", "PAUSED", "CLOSED"].map(status => ({
    name: status,
    value: statusGroups.find(g => g.status === status)?._count || 0
  }));

  const typeCounts = ["INCIDENT", "PROBLEM", "SRO", "NSRO", "OTHERS", "HEALTH_CHECK"].map(type => ({
    name: type,
    value: typeGroups.find(g => g.type === type)?._count || 0
  }));

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
