"use server";

import { prisma } from "@/lib/prisma";
import { resetSlaConfigCache } from "@/lib/sla";
import { revalidatePath } from "next/cache";

/**
 * Get all holidays for a specific year.
 */
export async function getHolidays(year: number) {
  return prisma.holiday.findMany({
    where: { year },
    orderBy: { date: "asc" },
  });
}

/**
 * Add a single holiday.
 */
export async function addHoliday(date: string, name: string) {
  try {
    const d = new Date(date);
    const year = d.getFullYear();

    await prisma.holiday.create({
      data: { date: d, name, year },
    });

    resetSlaConfigCache();
    revalidatePath("/admin/settings/holidays");
    return { success: true };
  } catch (error: any) {
    if (error.code === "P2002") {
      return { error: "This date is already registered as a holiday" };
    }
    console.error("addHoliday error:", error);
    return { error: error.message || "Failed to add holiday" };
  }
}

/**
 * Delete a holiday by ID.
 */
export async function deleteHoliday(id: string) {
  try {
    await prisma.holiday.delete({ where: { id } });
    resetSlaConfigCache();
    revalidatePath("/admin/settings/holidays");
    return { success: true };
  } catch (error: any) {
    console.error("deleteHoliday error:", error);
    return { error: error.message || "Failed to delete holiday" };
  }
}

/**
 * Bulk add holidays (for batch import).
 */
export async function bulkAddHolidays(entries: { date: string; name: string }[]) {
  try {
    let added = 0;
    for (const entry of entries) {
      const d = new Date(entry.date);
      const year = d.getFullYear();
      try {
        await prisma.holiday.create({
          data: { date: d, name: entry.name, year },
        });
        added++;
      } catch {
        // Skip duplicates silently
      }
    }

    resetSlaConfigCache();
    revalidatePath("/admin/settings/holidays");
    return { success: true, count: added };
  } catch (error: any) {
    console.error("bulkAddHolidays error:", error);
    return { error: error.message || "Failed to bulk add holidays" };
  }
}

/**
 * Copy holidays from one year to another.
 */
export async function copyHolidaysFromYear(sourceYear: number, targetYear: number) {
  try {
    const sourceHolidays = await prisma.holiday.findMany({
      where: { year: sourceYear },
    });

    let copied = 0;
    for (const h of sourceHolidays) {
      const sourceDate = new Date(h.date);
      const newDate = new Date(targetYear, sourceDate.getMonth(), sourceDate.getDate());
      try {
        await prisma.holiday.create({
          data: { date: newDate, name: h.name, year: targetYear },
        });
        copied++;
      } catch {
        // Skip duplicates
      }
    }

    resetSlaConfigCache();
    revalidatePath("/admin/settings/holidays");
    return { success: true, count: copied };
  } catch (error: any) {
    console.error("copyHolidaysFromYear error:", error);
    return { error: error.message || "Failed to copy holidays" };
  }
}
