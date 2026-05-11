"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getUsers() {
  return await prisma.user.findMany({
    orderBy: { createdAt: 'desc' }
  });
}

export async function updateUserRole(userId: string, newRole: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { role: newRole }
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateUserInfo(userId: string, data: { name: string, email?: string | null }) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { 
        name: data.name,
        email: data.email
      }
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteUser(userId: string) {
  try {
    await prisma.user.delete({
      where: { id: userId }
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: "Không thể xóa user này do đã có dữ liệu liên quan (Request/WorkLog)." };
  }
}

export async function createUser(data: { username: string, name: string, role: string, password?: string }) {
  try {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) return { error: "Username này đã tồn tại trên hệ thống." };

    await prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        role: data.role,
        password: data.password || "password123", // Mật khẩu mặc định
      }
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function resetUserPassword(userId: string, newPassword?: string) {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { password: newPassword || "password123" }
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
