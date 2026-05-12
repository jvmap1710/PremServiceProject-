"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createNotification } from "./notification";
import { workLogSchema } from "@/lib/validations";

export async function addWorkLog(
  requestId: string, 
  hours: number, 
  description: string, 
  subTaskId?: string,
  serviceRequestItemId?: string
) {
  const session = await auth();
  if (!session) return { error: "Bạn cần đăng nhập để log job" };

  // 1. Zod Validation
  const validation = workLogSchema.safeParse({ requestId, hours, description, subTaskId, serviceRequestItemId });
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
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

export async function logTasTime(
  requestId: string,
  hours: number,
  description: string
) {
  console.log(`DEBUG - logTasTime called for request: ${requestId}, hours: ${hours}`);
  const session = await auth();
  if (!session) {
    console.log("DEBUG - logTasTime: No session found");
    return { error: "Bạn cần đăng nhập" };
  }
  
  const userRole = (session.user as any)?.role;
  if (userRole !== "TAS" && userRole !== "ADMIN") {
    console.log(`DEBUG - logTasTime: Unauthorized role: ${userRole}`);
    return { error: "Chỉ TAS hoặc ADMIN mới có thể log time overhead" };
  }

  if (isNaN(hours) || hours <= 0) {
    return { error: "Số giờ không hợp lệ" };
  }

  try {
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      include: { items: true }
    });

    if (!request) {
      console.log(`DEBUG - logTasTime: Request not found: ${requestId}`);
      return { error: "Không tìm thấy ticket" };
    }
    
    if (!request.items || request.items.length === 0) {
      console.log(`DEBUG - logTasTime: No SRO items for request: ${requestId}`);
      return { error: "Ticket này chưa có hạng mục SRO nào để chia đều thời gian" };
    }

    const itemCount = request.items.length;
    const hoursPerItem = hours / itemCount;
    const tasDescription = `[ĐIỀU PHỐI] ${description || "Meeting/Feedback"}`;

    console.log(`DEBUG - logTasTime: Splitting ${hours}h across ${itemCount} items (${hoursPerItem}h/item)`);

    // Create logs for each item
    await Promise.all(request.items.map(item => 
      prisma.workLog.create({
        data: {
          requestId,
          serviceRequestItemId: item.id,
          hours: hoursPerItem,
          description: tasDescription,
          userId: session.user?.id,
        }
      })
    ));

    console.log("DEBUG - logTasTime: Successfully created all work logs");

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);

    return { success: true, count: itemCount };
  } catch (error: any) {
    console.error("DEBUG - Error in logTasTime server action:", error);
    return { error: "Lỗi khi log time TAS: " + (error.message || "Unknown error") };
  }
}
