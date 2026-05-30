"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { revalidatePath } from "next/cache";

export async function updateGridTicket(id: string, payload: any) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TAS")) {
      return { error: "Unauthorized" };
    }

    await prisma.serviceRequest.update({
      where: { id },
      data: payload
    });

    revalidatePath("/requests");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateGridSlaLine(id: string, payload: any) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TAS")) {
      return { error: "Unauthorized" };
    }

    await prisma.slaLine.update({
      where: { id },
      data: payload
    });

    revalidatePath("/requests");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateGridSlaUpdateEntry(id: string, payload: any) {
  try {
    const session = await auth();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "TAS")) {
      return { error: "Unauthorized" };
    }

    await prisma.slaUpdateEntry.update({
      where: { id },
      data: payload
    });

    revalidatePath("/requests");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
