"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getBoards() {
  return await prisma.board.findMany({
    orderBy: { createdAt: 'asc' }
  });
}

export async function createBoard(name: string, filterType?: string, filterClient?: string) {
  try {
    const board = await prisma.board.create({
      data: {
        name,
        filterType,
        filterClient,
        icon: filterType === "BUG" ? "Bug" : "LayoutGrid"
      }
    });
    revalidatePath("/");
    return { success: true, board };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteBoard(id: string) {
  try {
    await prisma.board.delete({ where: { id } });
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
