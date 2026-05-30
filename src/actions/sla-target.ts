"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Get all SLA targets for a specific package.
 */
export async function getSlaTargetsByPackage(packageId: string) {
  return prisma.slaTarget.findMany({
    where: { packageId },
    orderBy: [{ priority: "asc" }, { ticketType: "asc" }],
  });
}

/**
 * Upsert (create or update) a single SLA target.
 */
export async function upsertSlaTarget(data: {
  packageId: string;
  priority: string;
  ticketType: string;
  ackTargetHours: number;
  responseTargetHours: number;
  updateFreqTargetHours?: number | null;
  completionTargetHours?: number | null;
}) {
  try {
    await prisma.slaTarget.upsert({
      where: {
        packageId_priority_ticketType: {
          packageId: data.packageId,
          priority: data.priority,
          ticketType: data.ticketType,
        },
      },
      update: {
        ackTargetHours: data.ackTargetHours,
        responseTargetHours: data.responseTargetHours,
        updateFreqTargetHours: data.updateFreqTargetHours ?? null,
        completionTargetHours: data.completionTargetHours ?? null,
      },
      create: {
        packageId: data.packageId,
        priority: data.priority,
        ticketType: data.ticketType,
        ackTargetHours: data.ackTargetHours,
        responseTargetHours: data.responseTargetHours,
        updateFreqTargetHours: data.updateFreqTargetHours ?? null,
        completionTargetHours: data.completionTargetHours ?? null,
      },
    });

    revalidatePath("/clients");
    return { success: true };
  } catch (error: any) {
    console.error("upsertSlaTarget error:", error);
    return { error: error.message || "Failed to save SLA target" };
  }
}

/**
 * Delete a single SLA target.
 */
export async function deleteSlaTarget(id: string) {
  try {
    await prisma.slaTarget.delete({ where: { id } });
    revalidatePath("/clients");
    return { success: true };
  } catch (error: any) {
    console.error("deleteSlaTarget error:", error);
    return { error: error.message || "Failed to delete SLA target" };
  }
}

/**
 * Bulk save SLA targets for a package (replace all).
 */
export async function bulkSaveSlaTargets(
  packageId: string,
  targets: {
    priority: string;
    ticketType: string;
    ackTargetHours: number;
    responseTargetHours: number;
    updateFreqTargetHours?: number | null;
    completionTargetHours?: number | null;
  }[]
) {
  try {
    // Delete existing targets for this package
    await prisma.slaTarget.deleteMany({ where: { packageId } });

    // Create new targets
    for (const t of targets) {
      await prisma.slaTarget.create({
        data: {
          packageId,
          priority: t.priority,
          ticketType: t.ticketType,
          ackTargetHours: t.ackTargetHours,
          responseTargetHours: t.responseTargetHours,
          updateFreqTargetHours: t.updateFreqTargetHours ?? null,
          completionTargetHours: t.completionTargetHours ?? null,
        },
      });
    }

    revalidatePath("/clients");
    return { success: true, count: targets.length };
  } catch (error: any) {
    console.error("bulkSaveSlaTargets error:", error);
    return { error: error.message || "Failed to save SLA targets" };
  }
}
