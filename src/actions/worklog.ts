"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createNotification } from "./notification";

export async function addWorkLog(
  requestId: string, 
  hours: number, 
  description: string, 
  subTaskId?: string,
  serviceRequestItemId?: string
) {
  const session = await auth();
  
  if (!requestId || isNaN(hours) || hours <= 0) {
    return { error: "Thông tin log time không hợp lệ" };
  }

  try {
    const workLog = await prisma.workLog.create({
      data: {
        requestId,
        subTaskId: subTaskId || null,
        serviceRequestItemId: serviceRequestItemId || null,
        hours,
        description,
        userId: session?.user?.id || null,
      },
      include: {
        user: {
          select: { name: true }
        },
        serviceRequestItem: {
          include: { sroRule: true }
        }
      }
    });

    // Notify relevant users
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { 
        code: true, 
        title: true, 
        client: { select: { ownerId: true } }
      }
    });

    if (request && request.client.ownerId && request.client.ownerId !== session?.user?.id) {
      const userName = session?.user?.name || "Một nhân viên";
      await createNotification({
        userId: request.client.ownerId,
        title: `⏱️ Log công việc mới: ${hours}h`,
        message: `${userName} đã log job cho ${request.code}: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
        type: "WORK_LOG",
        link: `/requests/${requestId}`
      });
    }

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    
    return { success: true, workLog };
  } catch (error: any) {
    console.error("DEBUG - Error in addWorkLog:", error);
    return { error: "Không thể lưu log time" };
  }
}

export async function deleteWorkLog(id: string, requestId: string) {
  console.log(`DEBUG - Server Action: deleteWorkLog called for ID: ${id}, RequestID: ${requestId}`);
  try {
    const deleted = await prisma.workLog.delete({
      where: { id }
    });
    console.log(`DEBUG - Server Action: Successfully deleted workLog: ${deleted.id}`);

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    
    return { success: true };
  } catch (error: any) {
    console.error("DEBUG - Error in deleteWorkLog:", error);
    return { error: "Không thể xóa log time: " + error.message };
  }
}

export async function updateWorkLog(
  id: string,
  requestId: string,
  hours: number,
  description: string,
  subTaskId?: string,
  serviceRequestItemId?: string
) {
  if (isNaN(hours) || hours <= 0) {
    return { error: "Số giờ không hợp lệ" };
  }

  try {
    const workLog = await prisma.workLog.update({
      where: { id },
      data: {
        hours,
        description,
        subTaskId: subTaskId || null,
        serviceRequestItemId: serviceRequestItemId || null,
      },
      include: {
        user: { select: { name: true } },
        serviceRequestItem: { include: { sroRule: true } }
      }
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    
    return { success: true, workLog };
  } catch (error: any) {
    console.error("DEBUG - Error in updateWorkLog:", error);
    return { error: "Không thể cập nhật log time" };
  }
}
