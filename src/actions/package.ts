"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createPremiumPackage(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "You do not have permission to perform this action" };
  }

  const clientId = formData.get("clientId") as string;
  const name = formData.get("name") as string;
  const validFrom = formData.get("validFrom") as string;
  const validTo = formData.get("validTo") as string;
  const rawPrice = formData.get("monthlyPrice") as string;
  const monthlyPrice = parseFloat(rawPrice?.replace(/[^0-9.-]/g, '')) || 0;
  const monthlyQuota = 0; // Auto-calculated

  if (!clientId || !name || !validFrom || !validTo) {
    return { error: "Please fill in all required fields validly" };
  }

  try {
    await prisma.premiumPackage.create({
      data: {
        clientId,
        name,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        monthlyQuota,
        monthlyPrice,
        isActive: true, // Default active on creation
      },
    });

    // After creation, sync states (deactivate older active packages if any)
    await syncPackageStatuses(clientId);

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in createPremiumPackage:", error);
    return { error: error.message || "Error occurred while creating Premium package" };
  }
}

export async function syncPackageStatuses(clientId?: string) {
  try {
    const now = new Date();
    
    // 1. Auto deactivate expired packages
    await prisma.premiumPackage.updateMany({
      where: {
        ...(clientId ? { clientId } : {}),
        isActive: true,
        validTo: { lt: now }
      },
      data: { isActive: false }
    });

    // 2. Ensure each client has max 1 Active package (newest package in future/present)
    // If multiple valid packages, keep the one with largest ID or newest creation date
    if (clientId) {
      const activePackages = await prisma.premiumPackage.findMany({
        where: { clientId, isActive: true },
        orderBy: { validFrom: 'desc' }
      });

      if (activePackages.length > 2) {
        const [keep1, keep2, ...others] = activePackages;
        await prisma.premiumPackage.updateMany({
          where: { id: { in: others.map(p => p.id) } },
          data: { isActive: false }
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing package statuses:", error);
    return { error: "Could not sync package statuses" };
  }
}

export async function updatePremiumPackage(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "You do not have permission to perform this action" };
  }

  const id = formData.get("id") as string;
  const clientId = formData.get("clientId") as string;
  const name = formData.get("name") as string;
  const validFrom = formData.get("validFrom") as string;
  const validTo = formData.get("validTo") as string;
  const rawPrice = formData.get("monthlyPrice") as string;
  const monthlyPrice = parseFloat(rawPrice?.replace(/[^0-9.-]/g, '')) || 0;
  const isActive = formData.get("isActive") === "true";

  if (!id || !clientId || !name || !validFrom || !validTo) {
    return { error: "Please fill in all required fields validly" };
  }

  try {
    await prisma.premiumPackage.update({
      where: { id },
      data: {
        name,
        validFrom: new Date(validFrom),
        validTo: new Date(validTo),
        isActive,
        monthlyPrice,
      },
    });

    if (isActive) {
      await syncPackageStatuses(clientId);
    }

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in updatePremiumPackage:", error);
    return { error: error.message || "Error occurred while updating Premium package" };
  }
}

export async function deletePremiumPackage(id: string, clientId: string) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "You do not have permission to perform this action" };
  }
  
  try {
    await prisma.premiumPackage.delete({
      where: { id },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    return { error: "Error occurred while deleting Premium package" };
  }
}

export async function addSRORule(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "You do not have permission to perform this action" };
  }

  const packageId = formData.get("packageId") as string;
  const taskName = formData.get("taskName") as string;
  const scope = formData.get("scope") as string | null;
  const exclusions = formData.get("exclusions") as string | null;
  const estimateHours = parseFloat(formData.get("estimateHours") as string);
  const requestsPerMonth = parseFloat(formData.get("requestsPerMonth") as string);
  const notes = formData.get("notes") as string | null;

  if (!packageId || !taskName || isNaN(estimateHours) || isNaN(requestsPerMonth)) {
    return { error: "Please fill in all required fields validly" };
  }

  try {
    const pkg = await prisma.premiumPackage.findUnique({
      where: { id: packageId },
      select: { id: true, clientId: true, monthlyQuota: true }
    });

    if (!pkg) return { error: "Package does not exist" };

    await prisma.sRORule.create({
      data: {
        packageId,
        taskName,
        scope,
        exclusions,
        estimateHours,
        requestsPerMonth,
        notes,
      },
    });

    // Recalculate total quota from all rules to ensure consistency
    const allRules = await prisma.sRORule.findMany({
      where: { packageId }
    });
    
    const newTotalQuota = allRules.reduce((total, rule) => {
      return total + Math.round(rule.estimateHours * rule.requestsPerMonth);
    }, 0);

    await prisma.premiumPackage.update({
      where: { id: packageId },
      data: { monthlyQuota: newTotalQuota }
    });

    revalidatePath(`/clients/${pkg.clientId}`);
    return { success: true };
  } catch (error: any) {
    console.error("DEBUG - Error in addSRORule:", error);
    return { error: `System error: ${error.message || "Unknown"}` };
  }
}

export async function updateSRORule(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "You do not have permission to perform this action" };
  }

  const id = formData.get("id") as string;
  const packageId = formData.get("packageId") as string;
  const taskName = formData.get("taskName") as string;
  const scope = formData.get("scope") as string | null;
  const exclusions = formData.get("exclusions") as string | null;
  const estimateHours = parseFloat(formData.get("estimateHours") as string);
  const requestsPerMonth = parseFloat(formData.get("requestsPerMonth") as string);
  const notes = formData.get("notes") as string | null;

  if (!id || !packageId || !taskName || isNaN(estimateHours) || isNaN(requestsPerMonth)) {
    console.warn("DEBUG - updateSRORule validation failed:", { id, packageId, taskName, estimateHours, requestsPerMonth });
    return { error: "Please fill in all required fields validly" };
  }

  try {
    const pkg = await prisma.premiumPackage.findUnique({
      where: { id: packageId },
      include: { sroRules: true }
    });

    if (!pkg) return { error: "Package does not exist" };

    await prisma.sRORule.update({
      where: { id },
      data: {
        taskName,
        scope,
        exclusions,
        estimateHours,
        requestsPerMonth,
        notes,
      },
    });

    // Recalculate total quota
    const allRules = await prisma.sRORule.findMany({
      where: { packageId }
    });
    
    const newTotalQuota = allRules.reduce((total, rule) => {
      return total + Math.round(rule.estimateHours * rule.requestsPerMonth);
    }, 0);

    await prisma.premiumPackage.update({
      where: { id: packageId },
      data: { monthlyQuota: newTotalQuota }
    });

    revalidatePath(`/clients/${pkg.clientId}`);
    return { success: true };
  } catch (error: any) {
    console.error("DEBUG - Error in updateSRORule:", error);
    return { error: `System error: ${error.message || "Unknown"}` };
  }
}

export async function deleteSRORule(id: string, packageId: string) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "You do not have permission to perform this action" };
  }
  
  try {
    const rule = await prisma.sRORule.findUnique({
      where: { id },
      include: { package: true }
    });

    if (!rule) return { error: "Rule does not exist" };

    await prisma.sRORule.delete({
      where: { id },
    });

    // Recalculate total quota
    const allRules = await prisma.sRORule.findMany({
      where: { packageId }
    });
    
    const newTotalQuota = allRules.reduce((total, r) => {
      return total + Math.round(r.estimateHours * r.requestsPerMonth);
    }, 0);

    await prisma.premiumPackage.update({
      where: { id: packageId },
      data: { monthlyQuota: newTotalQuota }
    });

    revalidatePath(`/clients/${rule.package.clientId}`);
    return { success: true };
  } catch (error: any) {
    console.error("DEBUG - Error in deleteSRORule:", error);
    return { error: `System error: ${error.message || "Unknown"}` };
  }
}

/**
 * Story 3.4: Profitability Safeguard
 * Calculates the total used hours for a package in the current month.
 */
export async function getPackageUsage(packageId: string) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const pkg = await prisma.premiumPackage.findUnique({
      where: { id: packageId },
      select: { monthlyQuota: true }
    });

    if (!pkg) return { error: "Package does not exist" };

    const requests = await prisma.serviceRequest.findMany({
      where: {
        packageId,
        raiseDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        }
      },
      include: {
        items: {
          include: {
            sroRule: true
          }
        }
      }
    });

    const usedHours = requests.reduce((acc, req) => {
      const reqHours = req.items.reduce((sum, item) => sum + (item.sroRule.estimateHours * (item.quantity || 1)), 0);
      return acc + reqHours;
    }, 0);

    const ruleUsage: Record<string, number> = {};
    requests.forEach(req => {
      req.items.forEach(item => {
        ruleUsage[item.sroRuleId] = (ruleUsage[item.sroRuleId] || 0) + (item.quantity || 1);
      });
    });

    return {
      usedHours,
      monthlyQuota: pkg.monthlyQuota,
      isOver: usedHours >= pkg.monthlyQuota && pkg.monthlyQuota > 0,
      ruleUsage
    };
  } catch (error: any) {
    console.error("DEBUG - Error in getPackageUsage:", error);
    return { error: "Could not calculate Quota usage" };
  }
}
