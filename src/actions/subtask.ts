"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { subTaskSchema } from "@/lib/validations";

export async function createSubTask(requestId: string, content: string, description?: string) {
  const session = await auth();
  if (!session) return { error: "You need to log in to create a sub-task" };

  // 1. Zod Validation
  const validation = subTaskSchema.safeParse({ requestId, content, description });
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

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
    return { error: `Error creating sub-task: ${error.message}` };
  }
}

export async function updateSubTask(id: string, requestId: string, data: { content?: string, description?: string, status?: string, isDone?: boolean }) {
  try {
    await prisma.subTask.update({
      where: { id },
      data
    });

    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating sub-task:", error);
    return { error: `Error updating sub-task: ${error.message}` };
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
    return { error: `Error deleting sub-task: ${error.message}` };
  }
}
