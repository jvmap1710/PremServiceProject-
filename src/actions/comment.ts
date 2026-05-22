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
    if (!session) return { error: "You need to log in to comment" };

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
      // Parse mentions inside the comment content
      const allUsers = await prisma.user.findMany({
        where: { email: { not: null } }
      });

      const mentionedUsers = allUsers.filter(user => {
        if (user.email === session?.user?.email) return false; // Exclude author
        return content.includes(`@${user.name}`);
      });

      const mentionedUserIds = new Set(mentionedUsers.map(u => u.id));
      const mentionedEmails = mentionedUsers.map(u => u.email).filter((e): e is string => !!e);

      // 1. In-app notification for mentioned users
      for (const targetUser of mentionedUsers) {
        await createNotification({
          userId: targetUser.id,
          title: `🔔 You were mentioned by ${authorName}`,
          message: `Request ${request.code}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
          type: "COMMENT",
          link: `/requests/${requestId}`
        });
      }

      // 2. In-app notification for standard targets (Assignee, Creator) who are NOT mentioned
      const targets = new Set<string>();
      if (request.assigneeId) targets.add(request.assigneeId);
      if (request.createdById) targets.add(request.createdById);

      for (const targetId of targets) {
        if (targetId !== session?.user?.id && !mentionedUserIds.has(targetId)) {
          await createNotification({
            userId: targetId,
            title: `💬 New comment from ${authorName}`,
            message: `Request ${request.code}: ${content.substring(0, 50)}${content.length > 50 ? '...' : ''}`,
            type: "COMMENT",
            link: `/requests/${requestId}`
          });
        }
      }

      // 3. Email notifications
      try {
        // Send special mention email to each mentioned user
        for (const targetUser of mentionedUsers) {
          await NotificationService.notifyMentionInComment(request, comment, authorName, targetUser);
        }

        // Send standard email to default recipients, excluding mentioned users to prevent duplication
        await NotificationService.notifyNewComment(request, comment, authorName, mentionedEmails);
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
    if (!session) return { error: "You need to log in" };

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userEmail: true }
    });

    if (!comment) return { error: "Comment does not exist" };

    const isAuthor = comment.userEmail === session.user?.email;
    const isAdmin = session.user?.role === "ADMIN";

    if (!isAuthor && !isAdmin) {
      return { error: "You do not have permission to delete this comment" };
    }

    await prisma.comment.delete({ where: { id } });
    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
