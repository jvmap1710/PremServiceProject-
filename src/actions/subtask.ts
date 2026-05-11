"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function createSubTask(requestId: string, content: string, description?: string) {
  if (!content.trim()) return { error: "Nội dung không được để trống" };

  try {
    const subTask = await prisma.subTask.create({
      data: {
        requestId,
        content,
        description,
        status: "TODO"
      }
    });

    revalidatePath(`/requests/${requestId}`);
    return { success: true, subTask };
  } catch (error: any) {
    console.error("Error creating sub-task:", error);
    return { error: `Lỗi tạo sub-task: ${error.message}` };
  }
}

export async function updateSubTask(id: string, requestId: string, data: { content?: string, description?: string, status?: string }) {
  try {
    await prisma.subTask.update({
      where: { id },
      data
    });

    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating sub-task:", error);
    return { error: `Lỗi cập nhật sub-task: ${error.message}` };
  }
}

export async function deleteSubTask(id: string, requestId: string) {
  try {
    await prisma.subTask.delete({
      where: { id }
    });

    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error deleting sub-task:", error);
    return { error: `Lỗi xóa sub-task: ${error.message}` };
  }
}
