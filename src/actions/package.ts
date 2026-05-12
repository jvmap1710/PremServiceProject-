"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";

export async function createPremiumPackage(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "Bạn không có quyền thực hiện hành động này" };
  }

  const clientId = formData.get("clientId") as string;
  const name = formData.get("name") as string;
  const validFrom = formData.get("validFrom") as string;
  const validTo = formData.get("validTo") as string;
  const rawPrice = formData.get("monthlyPrice") as string;
  const monthlyPrice = parseFloat(rawPrice?.replace(/[^0-9.-]/g, '')) || 0;
  const monthlyQuota = 0; // Tự động tính

  if (!clientId || !name || !validFrom || !validTo) {
    return { error: "Vui lòng điền đầy đủ thông tin hợp lệ" };
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
        isActive: true, // Mặc định là active khi tạo mới
      },
    });

    // Sau khi tạo, đảm bảo sync lại trạng thái (nếu có gói khác đang active thì deactive gói cũ)
    await syncPackageStatuses(clientId);

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error in createPremiumPackage:", error);
    return { error: error.message || "Đã xảy ra lỗi khi tạo gói Premium" };
  }
}

export async function syncPackageStatuses(clientId?: string) {
  try {
    const now = new Date();
    
    // 1. Tự động deactive các gói đã hết hạn
    await prisma.premiumPackage.updateMany({
      where: {
        ...(clientId ? { clientId } : {}),
        isActive: true,
        validTo: { lt: now }
      },
      data: { isActive: false }
    });

    // 2. Đảm bảo mỗi khách hàng chỉ có tối đa 1 gói Active (gói mới nhất trong tương lai/hiện tại)
    // Nếu có nhiều gói cùng Valid, giữ gói có ID lớn nhất hoặc ngày tạo mới nhất
    if (clientId) {
      const activePackages = await prisma.premiumPackage.findMany({
        where: { clientId, isActive: true },
        orderBy: { validFrom: 'desc' }
      });

      if (activePackages.length > 1) {
        const [keep, ...others] = activePackages;
        await prisma.premiumPackage.updateMany({
          where: { id: { in: others.map(p => p.id) } },
          data: { isActive: false }
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error syncing package statuses:", error);
    return { error: "Không thể đồng bộ trạng thái gói" };
  }
}

export async function updatePremiumPackage(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "Bạn không có quyền thực hiện hành động này" };
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
    return { error: "Vui lòng điền đầy đủ thông tin hợp lệ" };
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
    return { error: error.message || "Đã xảy ra lỗi khi cập nhật gói Premium" };
  }
}

export async function deletePremiumPackage(id: string, clientId: string) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "Bạn không có quyền thực hiện hành động này" };
  }
  
  try {
    await prisma.premiumPackage.delete({
      where: { id },
    });

    revalidatePath(`/clients/${clientId}`);
    return { success: true };
  } catch (error) {
    return { error: "Đã xảy ra lỗi khi xóa gói Premium" };
  }
}

export async function addSRORule(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "Bạn không có quyền thực hiện hành động này" };
  }

  const packageId = formData.get("packageId") as string;
  const taskName = formData.get("taskName") as string;
  const scope = formData.get("scope") as string | null;
  const exclusions = formData.get("exclusions") as string | null;
  const estimateHours = parseFloat(formData.get("estimateHours") as string);
  const requestsPerMonth = parseInt(formData.get("requestsPerMonth") as string);

  if (!packageId || !taskName || isNaN(estimateHours) || isNaN(requestsPerMonth)) {
    return { error: "Vui lòng điền đầy đủ thông tin hợp lệ" };
  }

  try {
    const pkg = await prisma.premiumPackage.findUnique({
      where: { id: packageId },
      select: { id: true, clientId: true, monthlyQuota: true }
    });

    if (!pkg) return { error: "Gói không tồn tại" };

    await prisma.sRORule.create({
      data: {
        packageId,
        taskName,
        scope,
        exclusions,
        estimateHours,
        requestsPerMonth,
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
    return { error: `Lỗi hệ thống: ${error.message || "Không xác định"}` };
  }
}

export async function updateSRORule(formData: FormData) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "Bạn không có quyền thực hiện hành động này" };
  }

  const id = formData.get("id") as string;
  const packageId = formData.get("packageId") as string;
  const taskName = formData.get("taskName") as string;
  const scope = formData.get("scope") as string | null;
  const exclusions = formData.get("exclusions") as string | null;
  const estimateHours = parseFloat(formData.get("estimateHours") as string);
  const requestsPerMonth = parseInt(formData.get("requestsPerMonth") as string);

  if (!id || !packageId || !taskName || isNaN(estimateHours) || isNaN(requestsPerMonth)) {
    console.warn("DEBUG - updateSRORule validation failed:", { id, packageId, taskName, estimateHours, requestsPerMonth });
    return { error: "Vui lòng điền đầy đủ thông tin hợp lệ" };
  }

  try {
    const pkg = await prisma.premiumPackage.findUnique({
      where: { id: packageId },
      include: { sroRules: true }
    });

    if (!pkg) return { error: "Gói không tồn tại" };

    await prisma.sRORule.update({
      where: { id },
      data: {
        taskName,
        scope,
        exclusions,
        estimateHours,
        requestsPerMonth,
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
    return { error: `Lỗi hệ thống: ${error.message || "Không xác định"}` };
  }
}

export async function deleteSRORule(id: string, packageId: string) {
  const session = await auth();
  if (!session || !["ADMIN", "TAS"].includes(session.user?.role || "")) {
    return { error: "Bạn không có quyền thực hiện hành động này" };
  }
  
  try {
    const rule = await prisma.sRORule.findUnique({
      where: { id },
      include: { package: true }
    });

    if (!rule) return { error: "Quy tắc không tồn tại" };

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
    return { error: `Lỗi hệ thống: ${error.message || "Không xác định"}` };
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

    if (!pkg) return { error: "Gói không tồn tại" };

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
    return { error: "Không thể tính toán mức độ sử dụng Quota" };
  }
}
