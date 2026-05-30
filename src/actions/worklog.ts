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
  if (!session) return { error: "You need to log in to log work" };

  // 1. Zod Validation
  const validation = workLogSchema.safeParse({ requestId, hours, description, subTaskId, serviceRequestItemId });
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  try {
    const workLog = await prisma.$transaction(async (tx) => {
      const wl = await tx.workLog.create({
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

      const sroTaskName = wl.serviceRequestItem?.sroRule?.taskName;
      const sroDetailStr = sroTaskName ? ` for item "${sroTaskName}"` : "";
      
      await tx.auditLog.create({
        data: {
          requestId,
          userId: session.user?.id,
          action: "LOG_TIME",
          details: `Work log${sroDetailStr}: ${hours}h - ${description}`
        }
      });

      return wl;
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
      const userName = session?.user?.name || "A team member";
      await createNotification({
        userId: request.client.ownerId,
        title: `⏱️ New work log: ${hours}h`,
        message: `${userName} logged work for ${request.code}: ${description.substring(0, 50)}${description.length > 50 ? '...' : ''}`,
        type: "WORK_LOG",
        link: `/requests/${requestId}`
      });
    }

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    
    return { success: true, workLog };
  } catch (error: any) {
    console.error("DEBUG - Error in addWorkLog:", error);
    return { error: "Cannot save work log" };
  }
}

export async function deleteWorkLog(id: string, requestId: string) {
  console.log(`DEBUG - Server Action: deleteWorkLog called for ID: ${id}, RequestID: ${requestId}`);
  const session = await auth();
  if (!session) return { error: "Unauthorized" };
  try {
    // Fetch log details first
    const targetLog = await prisma.workLog.findUnique({
      where: { id },
      include: { 
        serviceRequestItem: { include: { sroRule: true } },
        request: { select: { status: true } }
      }
    });

    if (!targetLog) return { error: "Work log not found" };

    const userRole = (session.user as any)?.role;
    const isAuthor = targetLog.userId === session.user?.id;
    const isAdmin = userRole === "ADMIN";
    const isTAS = userRole === "TAS";

    if (!isAuthor && !isAdmin && !isTAS) {
      return { error: "You do not have permission to delete this work log" };
    }

    if (isAuthor && !isAdmin && !isTAS) {
      const reqStatus = targetLog.request?.status;
      if (reqStatus === "COMPLETED" || reqStatus === "CLOSED") {
        return { error: "Cannot delete work log because the request is COMPLETED or CLOSED" };
      }
    }

    let details = "";
    if (targetLog.groupId) {
      const groupLogs = await prisma.workLog.findMany({
        where: { groupId: targetLog.groupId }
      });
      const totalHours = groupLogs.reduce((sum, l) => sum + l.hours, 0);
      details = `Deleted work log (split group): Total ${totalHours}h - ${targetLog.description}`;
    } else {
      const sroTaskName = targetLog.serviceRequestItem?.sroRule?.taskName;
      const sroDetailStr = sroTaskName ? ` for item "${sroTaskName}"` : "";
      details = `Deleted work log${sroDetailStr}: ${targetLog.hours}h - ${targetLog.description}`;
    }

    await prisma.$transaction(async (tx) => {
      if (targetLog.groupId) {
        await tx.workLog.deleteMany({
          where: { groupId: targetLog.groupId }
        });
      } else {
        await tx.workLog.delete({
          where: { id }
        });
      }

      await tx.auditLog.create({
        data: {
          requestId,
          userId: session?.user?.id || null,
          action: "DELETE_TIME",
          details
        }
      });
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    
    return { success: true };
  } catch (error: any) {
    console.error("DEBUG - Error in deleteWorkLog:", error);
    return { error: "Cannot delete work log: " + error.message };
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
    return { error: "Invalid hours value" };
  }

  const session = await auth();
  if (!session) return { error: "Unauthorized" };

  try {
    const oldWorkLog = await prisma.workLog.findUnique({
      where: { id },
      include: { 
        serviceRequestItem: { include: { sroRule: true } },
        request: { select: { status: true } }
      }
    });

    if (!oldWorkLog) return { error: "Work log not found" };

    const userRole = (session.user as any)?.role;
    const isAuthor = oldWorkLog.userId === session.user?.id;
    const isAdmin = userRole === "ADMIN";
    const isTAS = userRole === "TAS";

    if (!isAuthor && !isAdmin && !isTAS) {
      return { error: "You do not have permission to edit this work log" };
    }

    if (isAuthor && !isAdmin && !isTAS) {
      const reqStatus = oldWorkLog.request?.status;
      if (reqStatus === "COMPLETED" || reqStatus === "CLOSED") {
        return { error: "Cannot edit work log because the request is COMPLETED or CLOSED" };
      }
    }

    const workLog = await prisma.$transaction(async (tx) => {
      const wl = await tx.workLog.update({
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

      const sroTaskName = wl.serviceRequestItem?.sroRule?.taskName;
      const sroDetailStr = sroTaskName ? ` for item "${sroTaskName}"` : "";

      await tx.auditLog.create({
        data: {
          requestId,
          userId: session?.user?.id || null,
          action: "UPDATE_TIME",
          details: `Updated work log${sroDetailStr}: Changed from [${oldWorkLog.hours}h - ${oldWorkLog.description}] to [${hours}h - ${description}]`
        }
      });

      return wl;
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    
    return { success: true, workLog };
  } catch (error: any) {
    console.error("DEBUG - Error in updateWorkLog:", error);
    return { error: "Cannot update work log" };
  }
}

export async function logTasTime(
  requestId: string,
  entries: { itemId: string; hours: number }[],
  description: string
) {
  console.log(`DEBUG - logTasTime called for request: ${requestId}, entries: ${JSON.stringify(entries)}`);
  const session = await auth();
  if (!session) {
    console.log("DEBUG - logTasTime: No session found");
    return { error: "You need to log in" };
  }
  
  const userRole = (session.user as any)?.role;
  if (userRole !== "TAS" && userRole !== "ADMIN") {
    console.log(`DEBUG - logTasTime: Unauthorized role: ${userRole}`);
    return { error: "Only TAS or ADMIN can log overhead time" };
  }

  if (!entries || entries.length === 0) {
    return { error: "No SRO items available to allocate" };
  }

  const totalHours = entries.reduce((sum, e) => sum + e.hours, 0);
  if (isNaN(totalHours) || totalHours <= 0) {
    return { error: "Invalid hours value" };
  }

  try {
    const groupId = `tas-split-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    const tasDescription = `${description || "Meeting/Feedback"} (Split across ${entries.length} SRO items)`;

    console.log(`DEBUG - logTasTime: Creating ${entries.length} logs with groupId: ${groupId}`);

    await prisma.$transaction(async (tx) => {
      // Create logs for each item with specified hours
      await Promise.all(entries.map(entry => 
        tx.workLog.create({
          data: {
            requestId,
            serviceRequestItemId: entry.itemId,
            hours: entry.hours,
            description: tasDescription,
            userId: session.user?.id,
            groupId: groupId
          }
        })
      ));

      await tx.auditLog.create({
        data: {
          requestId,
          userId: session.user?.id,
          action: "LOG_TIME_TAS",
          details: `Work log (TAS split): Total ${totalHours.toFixed(1)}h across ${entries.length} SRO items - ${description || "Meeting/Feedback"}`
        }
      });
    });

    console.log("DEBUG - logTasTime: Successfully created all work logs and audit entry");

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);

    return { success: true, count: entries.length };
  } catch (error: any) {
    console.error("DEBUG - Error in logTasTime server action:", error);
    return { error: "Error logging TAS time: " + (error.message || "Unknown error") };
  }
}
