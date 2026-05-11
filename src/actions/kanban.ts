"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getKanbanColumns() {
  const cols = await prisma.kanbanColumn.findMany({
    orderBy: { order: 'asc' }
  });

  // Initialize defaults if empty
  if (cols.length === 0) {
    const defaults = [
      { title: "Cần làm", statusKey: "TODO", order: 0 },
      { title: "Đang xử lý", statusKey: "IN_PROGRESS", order: 1 },
      { title: "Hoàn thành", statusKey: "DONE", order: 2 },
    ];
    
    for (const d of defaults) {
      await prisma.kanbanColumn.create({ data: d });
    }
    return await prisma.kanbanColumn.findMany({ orderBy: { order: 'asc' } });
  }

  return cols;
}

export async function createKanbanColumn(title: string) {
  try {
    const statusKey = title.toUpperCase().replace(/\s+/g, '_');
    const lastCol = await prisma.kanbanColumn.findFirst({
      orderBy: { order: 'desc' }
    });
    
    const col = await prisma.kanbanColumn.create({
      data: {
        title,
        statusKey,
        order: (lastCol?.order ?? 0) + 1
      }
    });
    revalidatePath("/");
    revalidatePath("/requests/kanban");
    return { success: true, col };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteKanbanColumn(id: string) {
  try {
    await prisma.kanbanColumn.delete({ where: { id } });
    revalidatePath("/");
    revalidatePath("/requests/kanban");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateKanbanColumnColor(id: string, color: string) {
  try {
    await prisma.kanbanColumn.update({
      where: { id },
      data: { color }
    });
    revalidatePath("/");
    revalidatePath("/requests/kanban");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateKanbanColumnTitle(id: string, title: string) {
  try {
    const newStatusKey = title.toUpperCase().replace(/\s+/g, '_');
    
    // Find old statusKey to migrate requests
    const oldCol = await prisma.kanbanColumn.findUnique({
      where: { id },
      select: { statusKey: true }
    });

    await prisma.$transaction(async (tx) => {
      // 1. Update column
      await tx.kanbanColumn.update({
        where: { id },
        data: { title, statusKey: newStatusKey }
      });

      // 2. Migrate requests if statusKey changed
      if (oldCol && oldCol.statusKey !== newStatusKey) {
        await tx.serviceRequest.updateMany({
          where: { status: oldCol.statusKey },
          data: { status: newStatusKey }
        });
      }
    });

    revalidatePath("/");
    revalidatePath("/requests/kanban");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

