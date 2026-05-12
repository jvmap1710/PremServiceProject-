"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createNotification } from "./notification";
import { auth } from "@/auth";
import { NotificationService } from "@/lib/notifications";
import { commentSchema } from "@/lib/validations";

export async function addComment(requestId: string, content: string, authorName: string) {
  try {
    const session = await auth();
    if (!session) return { error: "Bạn cần đăng nhập để bình luận" };

    // 1. Zod Validation
    const validation = commentSchema.safeParse({ requestId, content });
    if (!validation.success) {
      return { error: validation.error.issues[0].message };
    }

    const comment = await prisma.comment.create({
      data: {
        requestId,
        content,
        authorName,
        userEmail: session?.user?.email || null
      }
    });

    // Notify relevant users
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { 
        assignee: true,
        creator: true
      }
    });

    if (request) {
      const targets = new Set<string>();
      if (request.assigneeId) targets.add(request.assigneeId);
      if (request.createdById) targets.add(request.createdById);

      // In-app notification
      for (const targetId of targets) {
        if (targetId !== session?.user?.id) {
          await createNotification({
            userId: targetId,
            title: `💬 Bình luận mới từ ${authorName}`,
            message: `Yêu cầu ${request.code}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            type: "COMMENT",
            link: `/requests/${requestId}`
          });
        }
      }

      // Email notification
      try {
        await NotificationService.notifyNewComment(request, comment, authorName);
      } catch (mailErr) {
        console.error("Comment email notification failed:", mailErr);
      }
    }

    revalidatePath(`/requests/${requestId}`);
    revalidatePath("/");
    return { success: true, comment };
  } catch (error: any) {
    console.error("DEBUG - Error in addComment:", error);
    return { error: error.message };
  }
}

export async function deleteComment(id: string, requestId: string) {
  try {
    const session = await auth();
    if (!session) return { error: "Bạn cần đăng nhập" };

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userEmail: true }
    });

    if (!comment) return { error: "Bình luận không tồn tại" };

    const isAuthor = comment.userEmail === session.user?.email;
    const isAdmin = session.user?.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return { error: "Bạn không có quyền xóa bình luận này" };
    }

    await prisma.comment.delete({ where: { id } });
    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
