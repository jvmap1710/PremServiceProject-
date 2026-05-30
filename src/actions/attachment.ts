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
      include: {
        request: {
          select: {
            createdById: true,
            assigneeId: true,
            assigneeIds: true,
            client: { select: { ownerId: true } }
          }
        }
      }
    });

    if (!attachment) return { error: "Attachment not found" };

    const userId = session.user?.id;
    const userRole = (session.user as any)?.role;
    const isAdmin = userRole === "ADMIN" || userRole === "TAS";

    if (!isAdmin && attachment.request) {
      const req = attachment.request;
      const isUploader = attachment.userId === userId;
      const isCreator = req.createdById === userId;
      const isAssignee = req.assigneeId === userId || (req.assigneeIds && req.assigneeIds.split(',').map(i => i.trim()).includes(userId || ""));
      const isClientOwner = req.client?.ownerId === userId;
      
      if (!isUploader && !isCreator && !isAssignee && !isClientOwner) {
        return { error: "You do not have permission to delete this attachment" };
      }
    }

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
