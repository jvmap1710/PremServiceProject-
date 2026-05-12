"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createNotification } from "./notification";
import { NotificationService } from "@/lib/notifications";
import { requestSchema } from "@/lib/validations";


/**
 * Tự động deactive các gói đã hết hạn
 */
async function deactivateExpiredPackages() {
  const now = new Date();
  await prisma.premiumPackage.updateMany({
    where: { isActive: true, validTo: { lt: now } },
    data: { isActive: false }
  });
}

export type SROItem = { sroRuleId: string; quantity: number };

export async function createServiceRequest(formData: FormData) {
  const session = await auth();
  if (!session) return { error: "Bạn cần đăng nhập để tạo yêu cầu" };

  await deactivateExpiredPackages();

  // 1. Extract and Parse data
  const rawData = {
    clientId: formData.get("clientId") as string,
    packageId: formData.get("packageId") as string,
    title: formData.get("title") as string,
    userRequirement: formData.get("userRequirement") as string,
    description: formData.get("description") as string,
    type: formData.get("type") as string,
    priority: formData.get("priority") as string,
    deadline: formData.get("deadline") as string || null,
    assigneeId: formData.get("assigneeId") as string || null,
    items: JSON.parse(formData.get("sroItems") as string || "[]")
  };

  // 2. Zod Validation
  const validation = requestSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { clientId, packageId, title, userRequirement, description, type, priority, deadline, assigneeId, items: sroItems } = validation.data;
  const status = formData.get("status") as string || "TODO";
  const raiseDateStr = formData.get("raiseDate") as string;

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { code: true }
    });

    if (!client) return { error: "Khách hàng không tồn tại" };

    const lastRequest = await prisma.serviceRequest.findFirst({
      where: { clientId },
      orderBy: { code: 'desc' },
      select: { code: true }
    });

    let nextNumber = 1;
    if (lastRequest && lastRequest.code) {
      const parts = lastRequest.code.split('-');
      const lastNum = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastNum)) {
        nextNumber = lastNum + 1;
      }
    }
    const requestCode = `${client.code}-${nextNumber.toString().padStart(3, '0')}`;

    const session = await auth();
    const createdById = session?.user?.id || null;

    const request = await prisma.serviceRequest.create({
      data: {
        code: requestCode,
        clientId,
        packageId,
        title,
        userRequirement,
        description,
        status: status || "TODO",
        type: type || "TASK",
        priority,
        deadline: deadline ? new Date(deadline) : null,
        assigneeId: assigneeId || null,
        createdById,
        raiseDate: raiseDateStr ? new Date(raiseDateStr) : new Date(),
        items: {
          create: sroItems.map(item => ({
            sroRuleId: item.sroRuleId,
            quantity: item.quantity
          }))
        }
      }
    });

    if (assigneeId) {
      await createNotification({
        userId: assigneeId,
        title: "📌 Bạn đã được phân công yêu cầu mới",
        message: `Yêu cầu: ${requestCode} - ${title}`,
        type: "ASSIGNMENT",
        link: `/requests/${request.id}`
      });
    }

    // Gửi thông báo Email
    try {
      // Load thêm quan hệ để có data cho email
      const requestWithClient = await prisma.serviceRequest.findUnique({
        where: { id: request.id },
        include: { client: true }
      });
      await NotificationService.notifyNewRequest(requestWithClient);
      
      if (assigneeId) {
        const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
        if (assignee) {
          await NotificationService.notifyAssignment(requestWithClient, assignee);
        }
      }
    } catch (mailErr) {
      console.error("Email notification failed:", mailErr);
    }

    revalidatePath(`/clients/${clientId}`);
    revalidatePath("/requests");
    return { success: true, request };
  } catch (error: any) {
    console.error("Error creating Service Request:", error);
    return { error: `Lỗi tạo yêu cầu: ${error.message || "Unknown error"}` };
  }
}

export async function updateServiceRequest(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const userRequirement = formData.get("userRequirement") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const type = formData.get("type") as string;
  const priority = formData.get("priority") as string;
  const deadline = formData.get("deadline") as string;
  const assigneeId = formData.get("assigneeId") as string;
  const raiseDateStr = formData.get("raiseDate") as string;
  const sroItemsJson = formData.get("sroItems");

  // Validation: Only if they are provided, they must not be empty
  if (formData.has("title") && !title) return { error: "Tiêu đề không được để trống" };
  if (formData.has("description") && !description) return { error: "Mô tả không được để trống" };


  try {
    const session = await auth();
    if (!session) return { error: "Bạn cần đăng nhập" };

    // Danh sách để gửi thông báo sau khi transaction thành công
    let pendingNotifications: any[] = [];

    await prisma.$transaction(async (tx) => {
      const currentRequest = await tx.serviceRequest.findUnique({
        where: { id },
        select: { createdById: true, assigneeId: true, clientId: true, workLogs: { take: 1 } }
      });

      if (!currentRequest) return { error: "Yêu cầu không tồn tại" };

      const isCreator = currentRequest.createdById === session.user?.id;
      const isAssignee = currentRequest.assigneeId === session.user?.id;
      const isAdmin = session.user?.role === "ADMIN";
      const isTAS = session.user?.role === "TAS";

      // Security: Only related people can update
      if (!isCreator && !isAssignee && !isAdmin && !isTAS) {
        throw new Error("Bạn không có quyền chỉnh sửa yêu cầu này");
      }

      // 1. Kiểm tra nếu muốn chuyển sang DONE
      if (status === "DONE") {
        if (!isAssignee && !isAdmin && !isTAS) {
          throw new Error("Bạn không có quyền chuyển trạng thái yêu cầu này sang hoàn thành");
        }

        if (currentRequest.workLogs.length === 0) {
          throw new Error("Bạn phải log job ít nhất một lần trước khi hoàn thành yêu cầu");
        }
      }

      const oldRequest = await tx.serviceRequest.findUnique({
        where: { id },
        select: { assigneeId: true, code: true, title: true }
      });

      const updateData: any = {};
      if (formData.has("title")) updateData.title = title;
      if (formData.has("userRequirement")) updateData.userRequirement = userRequirement;
      if (formData.has("description")) updateData.description = description;
      if (formData.has("status")) updateData.status = status;
      if (formData.has("type")) updateData.type = type;
      if (formData.has("priority")) updateData.priority = priority;
      if (formData.has("deadline")) updateData.deadline = deadline ? new Date(deadline) : null;
      if (formData.has("assigneeId")) updateData.assigneeId = assigneeId || null;
      if (formData.has("raiseDate")) updateData.raiseDate = raiseDateStr ? new Date(raiseDateStr) : undefined;

      await tx.serviceRequest.update({
        where: { id },
        data: updateData
      });

      // Gom thông báo lại để xử lý sau
      if (updateData.assigneeId && updateData.assigneeId !== oldRequest?.assigneeId) {
        pendingNotifications.push({
          userId: updateData.assigneeId,
          title: "📌 Bạn có một phân công mới",
          message: `Yêu cầu: ${oldRequest?.code} - ${updateData.title || oldRequest?.title}`,
          type: "ASSIGNMENT",
          link: `/requests/${id}`
        });
      }

      if (updateData.status === "DONE" && oldRequest?.code) {
        const admins = await tx.user.findMany({
          where: { role: { in: ["ADMIN", "TAS"] } },
          select: { id: true }
        });
        
        for (const admin of admins) {
          if (admin.id !== session.user?.id) {
            pendingNotifications.push({
              userId: admin.id,
              title: "✅ Yêu cầu đã hoàn thành",
              message: `Mã: ${oldRequest.code} đã được chuyển sang trạng thái Hoàn thành`,
              type: "STATUS_CHANGE",
              link: `/requests/${id}`
            });
          }
        }
      }

      if (sroItemsJson !== null) {
        const sroItems: SROItem[] = JSON.parse(sroItemsJson as string || "[]");
        
        // 1. Lấy danh sách items hiện tại trong DB
        const existingItems = await tx.serviceRequestItem.findMany({
          where: { requestId: id }
        });

        // 2. Xác định các items cần giữ lại/cập nhật và các items mới
        const itemsToKeep = sroItems.filter(newItem => 
          existingItems.some(ex => ex.sroRuleId === newItem.sroRuleId)
        );
        const itemsToAdd = sroItems.filter(newItem => 
          !existingItems.some(ex => ex.sroRuleId === newItem.sroRuleId)
        );
        const itemIdsToKeep = itemsToKeep.map(i => i.sroRuleId);
        const itemsToDelete = existingItems.filter(ex => !itemIdsToKeep.includes(ex.sroRuleId));

        // 3. Cập nhật số lượng cho các items cũ
        for (const item of itemsToKeep) {
          await tx.serviceRequestItem.updateMany({
            where: { requestId: id, sroRuleId: item.sroRuleId },
            data: { quantity: item.quantity }
          });
        }

        // 4. Tạo mới các items chưa có
        for (const item of itemsToAdd) {
          await tx.serviceRequestItem.create({
            data: {
              requestId: id,
              sroRuleId: item.sroRuleId,
              quantity: item.quantity
            }
          });
        }

        // 5. Xóa các items không còn trong danh sách mới (chỉ xóa nếu không có WorkLogs bám vào)
        for (const item of itemsToDelete) {
          const hasLogs = await tx.workLog.findFirst({
            where: { serviceRequestItemId: item.id }
          });
          
          if (!hasLogs) {
            await tx.serviceRequestItem.delete({ where: { id: item.id } });
          }
          // Nếu có logs thì giữ lại item đó để tránh lỗi Foreign Key
        }
      }
    }, {
      timeout: 20000 // Tăng timeout lên 20 giây cho an toàn
    });

    // 2. Gửi thông báo hệ thống sau khi transaction thành công
    if (pendingNotifications.length > 0) {
      // Chạy bất đồng bộ để không chặn phản hồi của người dùng
      Promise.all(pendingNotifications.map(n => createNotification(n)))
        .catch(err => console.error("Delayed notifications failed:", err));
    }

    // Gửi thông báo Email ngoài Transaction
    try {
      if (assigneeId && formData.has("assigneeId")) {
        const req = await prisma.serviceRequest.findUnique({ where: { id }, include: { client: true } });
        const user = await prisma.user.findUnique({ where: { id: assigneeId } });
        if (req && user) await NotificationService.notifyAssignment(req, user);
      }
    } catch (mailErr) {
      console.error("Delayed email notification failed:", mailErr);
    }

    revalidatePath("/");
    revalidatePath("/requests");
    revalidatePath("/requests/kanban");
    revalidatePath(`/requests/${id}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("DEBUG - Error updating Request:", error);
    return { error: `Lỗi cập nhật: ${error.message}` };
  }
}

export async function updateRequestStatus(id: string, status: string) {
  try {
    const session = await auth();
    if (!session) return { error: "Bạn cần đăng nhập" };

    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { assigneeId: true, status: true, workLogs: { take: 1 } }
    });

    if (!currentRequest) return { error: "Yêu cầu không tồn tại" };

    if (status === "DONE") {
      const isAssignee = currentRequest.assigneeId === session.user?.id;
      const isAdmin = session.user?.role === "ADMIN";
      const isTAS = session.user?.role === "TAS";

      if (!isAssignee && !isAdmin && !isTAS) {
        return { error: "Bạn không có quyền hoàn thành yêu cầu này" };
      }

      if (currentRequest.workLogs.length === 0) {
        return { error: "Bạn phải log job ít nhất một lần trước khi hoàn thành" };
      }
    }

    await prisma.serviceRequest.update({
      where: { id },
      data: { status }
    });

    // Notify relevant users for ANY status change
    const req = await prisma.serviceRequest.findUnique({ 
      where: { id }, 
      include: { 
        client: { select: { ownerId: true } },
        assignee: true,
        creator: true
      } 
    });

    if (req) {
      const targets = new Set<string>();
      if (req.assigneeId) targets.add(req.assigneeId);
      if (req.client.ownerId) targets.add(req.client.ownerId);

      const statusLabels: Record<string, string> = {
        "TODO": "Cần làm",
        "IN_PROGRESS": "Đang xử lý",
        "DONE": "Hoàn thành"
      };

      for (const targetId of targets) {
        if (targetId !== session.user?.id) {
          await createNotification({
            userId: targetId,
            title: `🔄 Trạng thái thay đổi: ${statusLabels[status] || status}`,
            message: `Yêu cầu ${req.code} đã được chuyển sang "${statusLabels[status] || status}" bởi ${session.user?.name}`,
            type: "STATUS_CHANGE",
            link: `/requests/${id}`
          });
        }
      }

      // Special notification for Admins/TAS when DONE
      if (status === "DONE") {
        const admins = await prisma.user.findMany({ 
          where: { 
            role: { in: ["ADMIN", "TAS"] },
            id: { not: session.user?.id } 
          }, 
          select: { id: true, email: true, name: true } 
        });
        for (const admin of admins) {
          if (!targets.has(admin.id)) { // Avoid double notification
            await createNotification({
              userId: admin.id,
              title: "✅ Yêu cầu đã hoàn thành",
              message: `Mã: ${req.code} đã hoàn thành bởi ${session.user?.name}`,
              type: "STATUS_CHANGE",
              link: `/requests/${id}`
            });

            // Email cho Admin
            if (admin.email) {
              await NotificationService.notifyStatusChange(req, currentRequest.status, status, admin);
            }
          }
        }
      }

      // Thông báo cho Assignee/Creator qua email
      if (req.assigneeId && req.assigneeId !== session.user?.id) {
        await NotificationService.notifyStatusChange(req, currentRequest.status, status, req.assignee);
      }
      if (req.createdById && req.createdById !== session.user?.id && req.createdById !== req.assigneeId) {
        await NotificationService.notifyStatusChange(req, currentRequest.status, status, req.creator);
      }
    }

    revalidatePath("/requests");
    revalidatePath("/requests/kanban");
    revalidatePath("/");
    revalidatePath(`/requests/${id}`);
    
    return { success: true };
  } catch (error: any) {
    console.error("Failed to update status:", error);
    return { error: error.message };
  }
}

export async function getMyTasks() {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const role = session.user.role;
    let requests = [];

    if (role === "ADMIN" || role === "TAS" || role === "MANAGER") {
      requests = await prisma.serviceRequest.findMany({
        where: {
          OR: [
            { assigneeId: session.user.id },
            { client: { ownerId: session.user.id } }
          ],
          status: { in: ["TODO", "IN_PROGRESS"] }
        },
        orderBy: [
          { deadline: "asc" },
          { priority: "asc" }
        ],
        include: { client: true },
        take: 5
      });
    } else {
      requests = await prisma.serviceRequest.findMany({
        where: {
          assigneeId: session.user.id,
          status: { in: ["TODO", "IN_PROGRESS"] }
        },
        orderBy: { deadline: "asc" },
        include: { client: true },
        take: 5
      });
    }

    return { success: true, requests };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteServiceRequest(id: string) {
  try {
    const session = await auth();
    if (!session) return { error: "Bạn cần đăng nhập" };

    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { createdById: true, status: true }
    });

    if (!currentRequest) return { error: "Yêu cầu không tồn tại" };

    const isAdmin = session.user?.role === "ADMIN";
    const isCreator = currentRequest.createdById === session.user?.id;
    const isTodo = currentRequest.status === "TODO";

    // Security: Admin or (Creator + status TODO)
    if (!isAdmin && !(isCreator && isTodo)) {
      return { error: "Bạn không có quyền xóa yêu cầu này (Chỉ được xóa khi ở trạng thái TODO hoặc bạn là Admin)" };
    }

    await prisma.serviceRequest.delete({ where: { id } });
    revalidatePath("/requests");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
