"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/auth";

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
    return { error: "Cannot delete this user due to associated data (Request/WorkLog)." };
  }
}

export async function createUser(data: { username: string, name: string, role: string, password?: string }) {
  try {
    const existing = await prisma.user.findUnique({ where: { username: data.username } });
    if (existing) return { error: "This username already exists in the system." };

    const hashedPassword = await bcrypt.hash(data.password || "password123", 10);

    await prisma.user.create({
      data: {
        username: data.username,
        name: data.name,
        role: data.role,
        password: hashedPassword,
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
    const hashedPassword = await bcrypt.hash(newPassword || "password123", 10);
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function changeMyPassword(oldPassword: string, newPassword: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "You are not logged in" };

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user || !user.password) return { error: "Account does not exist" };

    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) return { error: "Current password is incorrect" };

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });
    
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
