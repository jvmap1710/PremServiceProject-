"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function deleteAttachment(id: string, requestId: string) {
  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  try {
    const attachment = await prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) return { error: "Attachment not found" };

    await prisma.$transaction([
      prisma.attachment.delete({ where: { id } }),
      prisma.auditLog.create({
        data: {
          requestId,
          userId: session.user?.id,
          action: "DELETE_EVIDENCE",
          details: `Deleted file: ${attachment.filename}`,
        },
      }),
    ]);

    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
