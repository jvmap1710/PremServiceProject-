"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { auth } from "@/auth";

export async function getNotifications() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, notifications: [] };

    const notifications = await prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return { success: true, notifications };
  } catch (error) {
    console.error("Error in getNotifications server action:", error);
    return { success: false, notifications: [], error: "Failed to fetch notifications" };
  }
}

export async function createNotification(data: {
  userId: string;
  title: string;
  message: string;
  type: "ASSIGNMENT" | "STATUS_CHANGE" | "COMMENT" | "WORK_LOG";
  link?: string;
}) {
  const notif = await prisma.notification.create({
    data: {
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      link: data.link
    }
  });
  revalidatePath("/");
  return notif;
}

export async function markAsRead(id: string) {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.notification.update({
      where: { id, userId: session.user.id }, // Security: Must belong to current user
      data: { isRead: true }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}

export async function markAllAsRead() {
  const session = await auth();
  if (!session?.user?.id) return { success: false };

  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, isRead: false },
      data: { isRead: true }
    });
    revalidatePath("/");
    return { success: true };
  } catch (error) {
    return { success: false };
  }
}
