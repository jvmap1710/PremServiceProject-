"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { createNotification } from "./notification";
import { NotificationService } from "@/lib/notifications";
import { requestSchema } from "@/lib/validations";
import { generateTicketCode } from "@/lib/generate-code";


/**
 * Auto-deactivate expired packages
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
  if (!session) return { error: "You need to log in to create a request" };

  await deactivateExpiredPackages();

  const assigneeIds = formData.get("assigneeIds") as string || null;
  let formAssigneeId = formData.get("assigneeId") as string || null;
  let formAssigneeIds = assigneeIds;
  if (assigneeIds) {
    const ids = assigneeIds.split(",").map(id => id.trim()).filter(Boolean);
    formAssigneeId = ids.length > 0 ? ids[0] : null;
  } else if (formAssigneeId) {
    formAssigneeIds = formAssigneeId;
  }

  // 1. Extract and Parse data
  const rawData = {
    clientId: formData.get("clientId") as string,
    packageId: formData.get("packageId") as string,
    title: formData.get("title") as string,
    userRequirement: formData.get("userRequirement") as string,
    description: formData.get("description") as string,
    type: formData.get("type") as string,
    priority: formData.get("priority") as string,
    taskPriority: formData.get("taskPriority") as string || null,
    urgency: formData.get("urgency") as string || null,
    impact: formData.get("impact") as string || null,
    deadline: formData.get("deadline") as string || null,
    assigneeId: formAssigneeId,
    items: JSON.parse(formData.get("sroItems") as string || "[]")
  };

  // 2. Zod Validation
  const validation = requestSchema.safeParse(rawData);
  if (!validation.success) {
    return { error: validation.error.issues[0].message };
  }

  const { 
    clientId, packageId, title, userRequirement, description, 
    type, priority, deadline, assigneeId, items: sroItems, 
    urgency, impact, taskPriority
  } = validation.data;

  // Only keep urgency and impact for INCIDENT and PROBLEM
  const isIncidentOrProblem = type === "INCIDENT" || type === "PROBLEM";
  const finalUrgency = isIncidentOrProblem ? urgency : null;
  const finalImpact = isIncidentOrProblem ? impact : null;
  const finalTaskPriority = taskPriority || "MEDIUM";

  const status = formData.get("status") as string || "TODO";
  const raiseDateStr = formData.get("raiseDate") as string;

  try {
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: { code: true }
    });

    if (!client) return { error: "Client does not exist" };

    const requestCode = await generateTicketCode(clientId, client.code, raiseDateStr ? new Date(raiseDateStr) : new Date());

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
        type: type || "INCIDENT",
        priority: priority || "P4",
        taskPriority: finalTaskPriority,
        urgency: finalUrgency,
        impact: finalImpact,
        deadline: deadline ? new Date(deadline) : null,
        assigneeId: assigneeId || null,
        assigneeIds: formAssigneeIds || null,
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

    // Auto-create exactly 1 SLA Line matching the ticket type and priority
    const matchingTarget = await prisma.slaTarget.findFirst({
      where: { 
        packageId, 
        ticketType: type || "INCIDENT", 
        priority: priority || "P4" 
      }
    });

    await prisma.slaLine.create({
      data: {
        requestId: request.id,
        title: `SLA: ${type || "INCIDENT"} - ${priority || "P4"}`,
        priority: priority || "P4",
        ticketType: type || "INCIDENT",
        ticketRequestDateTime: raiseDateStr ? new Date(raiseDateStr) : new Date(),
        ackSlaTarget: matchingTarget?.ackTargetHours ?? null,
        responseSlaTarget: matchingTarget?.responseTargetHours ?? null,
        updateFreqSlaTarget: matchingTarget?.updateFreqTargetHours ?? null,
        completionSlaTarget: matchingTarget?.completionTargetHours ?? null,
      }
    });

    if (formAssigneeIds) {
      const ids = formAssigneeIds.split(",").map(id => id.trim()).filter(Boolean);
      for (const uid of ids) {
        await createNotification({
          userId: uid,
          title: "📌 You have been assigned a new request",
          message: `Request: ${requestCode} - ${title}`,
          type: "ASSIGNMENT",
          link: `/requests/${request.id}`
        });
      }
    }

    // Send Email notification
    try {
      // Load additional relations for email data
      const requestWithClient = await prisma.serviceRequest.findUnique({
        where: { id: request.id },
        include: { client: true }
      });
      await NotificationService.notifyNewRequest(requestWithClient);
      
      if (formAssigneeIds) {
        const ids = formAssigneeIds.split(",").map(id => id.trim()).filter(Boolean);
        for (const uid of ids) {
          const assignee = await prisma.user.findUnique({ where: { id: uid } });
          if (assignee) {
            await NotificationService.notifyAssignment(requestWithClient, assignee);
          }
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
    return { error: `Error creating request: ${error.message || "Unknown error"}` };
  }
}

export async function updateServiceRequest(id: string, formData: FormData) {
  const title = formData.get("title") as string;
  const userRequirement = formData.get("userRequirement") as string;
  const description = formData.get("description") as string;
  const status = formData.get("status") as string;
  const type = formData.get("type") as string;
  const priority = formData.get("priority") as string;
  const taskPriority = formData.get("taskPriority") as string;
  const urgency = formData.get("urgency") as string;
  const impact = formData.get("impact") as string;
  const deadline = formData.get("deadline") as string;
  const assigneeId = formData.get("assigneeId") as string;
  const assigneeIds = formData.get("assigneeIds") as string;
  const packageId = formData.get("packageId") as string;
  const raiseDateStr = formData.get("raiseDate") as string;
  const escalation = formData.get("escalation") as string;
  const emailSubject = formData.get("emailSubject") as string;
  const agreedFinalSolutionStr = formData.get("agreedFinalSolution") as string;
  const estimatedTimelineStr = formData.get("estimatedTimeline") as string;
  const sroItemsJson = formData.get("sroItems");

  // Validation: Only if they are provided, they must not be empty
  if (formData.has("title") && !title) return { error: "Title cannot be empty" };
  if (formData.has("description") && !description) return { error: "Description cannot be empty" };


  try {
    const session = await auth();
    if (!session) return { error: "You need to log in" };

    // List of notifications to send after a successful transaction
    let pendingNotifications: any[] = [];

    await prisma.$transaction(async (tx) => {
      const currentRequest = await tx.serviceRequest.findUnique({
        where: { id },
        select: { createdById: true, assigneeId: true, assigneeIds: true, clientId: true, type: true, workLogs: { select: { user: { select: { role: true } } } } }
      });

      if (!currentRequest) return { error: "Request does not exist" };

      const isCreator = currentRequest.createdById === session.user?.id;
      const isAssignee = currentRequest.assigneeId === session.user?.id || 
        (currentRequest.assigneeIds && currentRequest.assigneeIds.split(",").map(id => id.trim()).includes(session.user?.id || ""));
      const isAdmin = session.user?.role === "ADMIN";
      const isTAS = session.user?.role === "TAS";

      // Security: Only related people can update
      if (!isCreator && !isAssignee && !isAdmin && !isTAS) {
        throw new Error("You do not have permission to edit this request");
      }

      // 1. Check if moving to DONE, COMPLETED, or CLOSED
      if (status === "DONE" || status === "COMPLETED" || status === "CLOSED") {
        if (!isAssignee && !isAdmin && !isTAS) {
          throw new Error("You do not have permission to mark this request as completed");
        }

        const hasEngineerLog = currentRequest.workLogs.some(log => log.user?.role !== "TAS" && log.user?.role !== "ADMIN");
        const hasTASLog = currentRequest.workLogs.some(log => log.user?.role === "TAS" || log.user?.role === "ADMIN");

        if (!hasEngineerLog || !hasTASLog) {
          throw new Error("Cannot close request: Both Engineer and TAS must log their time first.");
        }
      }

      const oldRequest = await tx.serviceRequest.findUnique({
        where: { id },
        select: {
          code: true,
          title: true,
          status: true,
          type: true,
          priority: true,
          taskPriority: true,
          urgency: true,
          impact: true,
          deadline: true,
          assigneeId: true,
          assigneeIds: true,
          assignee: { select: { name: true } },
          packageId: true,
          package: { select: { name: true } }
        }
      });

      if (oldRequest?.status === "CLOSED" && !isAdmin) {
        throw new Error("This request is CLOSED and can only be modified by an Admin.");
      }

      const updateData: any = {};
      if (formData.has("title")) updateData.title = title;
      if (formData.has("userRequirement")) updateData.userRequirement = userRequirement;
      if (formData.has("description")) updateData.description = description;
      if (formData.has("status")) updateData.status = status;
      if (formData.has("type")) updateData.type = type;
      if (formData.has("priority")) updateData.priority = priority;
      if (formData.has("taskPriority")) updateData.taskPriority = taskPriority || null;
      if (formData.has("urgency")) updateData.urgency = urgency || null;
      if (formData.has("impact")) updateData.impact = impact || null;
      if (formData.has("deadline")) updateData.deadline = deadline ? new Date(deadline) : null;
      
      if (formData.has("assigneeIds")) {
        updateData.assigneeIds = assigneeIds || null;
        const ids = (assigneeIds || "").split(",").map(id => id.trim()).filter(Boolean);
        updateData.assigneeId = ids.length > 0 ? ids[0] : null;
      } else if (formData.has("assigneeId")) {
        updateData.assigneeId = assigneeId || null;
        updateData.assigneeIds = assigneeId || null;
      }

      if (formData.has("packageId") && packageId) {
        updateData.packageId = packageId;
        const pkg = await tx.premiumPackage.findUnique({
          where: { id: packageId },
          select: { clientId: true }
        });
        if (pkg) {
          updateData.clientId = pkg.clientId;
        }
      }

      if (formData.has("raiseDate")) updateData.raiseDate = raiseDateStr ? new Date(raiseDateStr) : undefined;
      if (formData.has("escalation")) updateData.escalation = escalation || undefined;
      if (formData.has("emailSubject")) updateData.emailSubject = emailSubject || null;
      if (formData.has("agreedFinalSolution")) updateData.agreedFinalSolution = agreedFinalSolutionStr ? new Date(agreedFinalSolutionStr) : null;
      if (formData.has("estimatedTimeline")) updateData.estimatedTimeline = estimatedTimelineStr ? new Date(estimatedTimelineStr) : null;

      // Reset urgency/impact if ticket type becomes something other than INCIDENT or PROBLEM
      const finalType = formData.has("type") ? type : currentRequest.type;
      if (finalType !== "INCIDENT" && finalType !== "PROBLEM") {
        updateData.urgency = null;
        updateData.impact = null;
        // Default to P4 only if transitioning type from Incident/Problem to non-Incident/Problem
        // and a new priority value is not explicitly specified in the request.
        if (formData.has("type") && currentRequest.type !== type && !formData.has("priority")) {
          updateData.priority = "P4";
        }
      }

      await tx.serviceRequest.update({
        where: { id },
        data: updateData
      });

      // Compare and log changes to AuditLog
      if (oldRequest) {
        const changes: string[] = [];

        if (updateData.hasOwnProperty("title") && updateData.title !== oldRequest.title) {
          changes.push(`Changed title from "${oldRequest.title}" to "${updateData.title}"`);
        }
        if (updateData.hasOwnProperty("status") && updateData.status !== oldRequest.status) {
          const statusLabels: Record<string, string> = {
            "TODO": "New",
            "IN_PROGRESS": "In Progress",
            "DONE": "Completed",
            "PAUSED": "Paused",
            "CLOSED": "Closed"
          };
          const oldLabel = statusLabels[oldRequest.status] || oldRequest.status;
          const newLabel = statusLabels[updateData.status] || updateData.status;
          changes.push(`Changed status from "${oldLabel}" to "${newLabel}"`);
        }
        if (updateData.hasOwnProperty("type") && updateData.type !== oldRequest.type) {
          changes.push(`Changed request type from "${oldRequest.type}" to "${updateData.type}"`);
        }
        if (updateData.hasOwnProperty("priority") && updateData.priority !== oldRequest.priority) {
          changes.push(`Changed priority from "${oldRequest.priority}" to "${updateData.priority}"`);
        }
        if (updateData.hasOwnProperty("taskPriority") && updateData.taskPriority !== oldRequest.taskPriority) {
          const taskPriorityLabels: Record<string, string> = {
            "HIGHEST": "Highest",
            "HIGH": "High",
            "MEDIUM": "Medium",
            "LOW": "Low",
            "LOWEST": "Lowest",
            "": "None"
          };
          const oldLabel = taskPriorityLabels[oldRequest.taskPriority || ""] || oldRequest.taskPriority || "None";
          const newLabel = taskPriorityLabels[updateData.taskPriority || ""] || updateData.taskPriority || "None";
          changes.push(`Changed task priority from "${oldLabel}" to "${newLabel}"`);
        }
        if (updateData.hasOwnProperty("urgency")) {
          const oldUrgency = oldRequest.urgency || "";
          const newUrgency = updateData.urgency || "";
          if (newUrgency !== oldUrgency) {
            const urgencyLabels: Record<string, string> = {
              "IMMEDIATE": "Immediate",
              "URGENT": "Urgent",
              "MODERATE": "Moderate",
              "STANDARD": "Standard",
              "": "None"
            };
            const oldLabel = urgencyLabels[oldUrgency] || oldUrgency || "None";
            const newLabel = urgencyLabels[newUrgency] || newUrgency || "None";
            changes.push(`Changed urgency from "${oldLabel}" to "${newLabel}"`);
          }
        }
        if (updateData.hasOwnProperty("impact")) {
          const oldImpact = oldRequest.impact || "";
          const newImpact = updateData.impact || "";
          if (newImpact !== oldImpact) {
            const impactLabels: Record<string, string> = {
              "WIDESPREAD": "Widespread",
              "LARGE": "Large",
              "LIMITED": "Limited",
              "LOCALISED": "Localised",
              "": "None"
            };
            const oldLabel = impactLabels[oldImpact] || oldImpact || "None";
            const newLabel = impactLabels[newImpact] || newImpact || "None";
            changes.push(`Changed impact from "${oldLabel}" to "${newLabel}"`);
          }
        }
        if (updateData.hasOwnProperty("deadline")) {
          const oldTime = oldRequest.deadline ? new Date(oldRequest.deadline).getTime() : 0;
          const newTime = updateData.deadline ? new Date(updateData.deadline).getTime() : 0;
          if (newTime !== oldTime) {
            const oldStr = oldRequest.deadline ? new Date(oldRequest.deadline).toLocaleDateString("en-GB") : "None";
            const newStr = updateData.deadline ? new Date(updateData.deadline).toLocaleDateString("en-GB") : "None";
            changes.push(`Changed due date from "${oldStr}" to "${newStr}"`);
          }
        }
        if (updateData.hasOwnProperty("assigneeIds") && updateData.assigneeIds !== oldRequest.assigneeIds) {
          const oldIds = (oldRequest.assigneeIds || "").split(",").filter(Boolean);
          const newIds = (updateData.assigneeIds || "").split(",").filter(Boolean);
          const oldUsers = oldIds.length > 0 ? await tx.user.findMany({
            where: { id: { in: oldIds } },
            select: { name: true }
          }) : [];
          const newUsers = newIds.length > 0 ? await tx.user.findMany({
            where: { id: { in: newIds } },
            select: { name: true }
          }) : [];
          const oldNames = oldUsers.map(u => u.name).join(", ") || "Unassigned";
          const newNames = newUsers.map(u => u.name).join(", ") || "Unassigned";
          changes.push(`Changed assignee(s) from "${oldNames}" to "${newNames}"`);
        } else if (updateData.hasOwnProperty("assigneeId") && updateData.assigneeId !== oldRequest.assigneeId) {
          let newAssigneeName = "Unassigned";
          if (updateData.assigneeId) {
            const newAssigneeUser = await tx.user.findUnique({
              where: { id: updateData.assigneeId },
              select: { name: true }
            });
            if (newAssigneeUser?.name) {
              newAssigneeName = newAssigneeUser.name;
            }
          }
          const oldAssigneeName = oldRequest.assignee?.name || "Unassigned";
          changes.push(`Changed assignee from "${oldAssigneeName}" to "${newAssigneeName}"`);
        }
        if (updateData.hasOwnProperty("packageId") && updateData.packageId !== oldRequest.packageId) {
          let newPackageName = "Not selected";
          if (updateData.packageId) {
            const newPkg = await tx.premiumPackage.findUnique({
              where: { id: updateData.packageId },
              select: { name: true }
            });
            if (newPkg?.name) {
              newPackageName = newPkg.name;
            }
          }
          const oldPackageName = oldRequest.package?.name || "Not selected";
          changes.push(`Changed service package from "${oldPackageName}" to "${newPackageName}"`);
        }

        if (changes.length > 0) {
          await tx.auditLog.create({
            data: {
              requestId: id,
              userId: session.user?.id,
              action: "UPDATE_INFO",
              details: changes.join(", ")
            }
          });
        }
      }

      // Batch notifications for later processing
      if (updateData.assigneeIds && updateData.assigneeIds !== oldRequest?.assigneeIds) {
        const oldIds = (oldRequest?.assigneeIds || "").split(",").filter(Boolean);
        const newIds = (updateData.assigneeIds || "").split(",").filter(Boolean);
        const addedIds = newIds.filter((id: string) => !oldIds.includes(id));
        for (const addedId of addedIds) {
          pendingNotifications.push({
            userId: addedId,
            title: "📌 You have a new assignment",
            message: `Request: ${oldRequest?.code} - ${updateData.title || oldRequest?.title}`,
            type: "ASSIGNMENT",
            link: `/requests/${id}`
          });
        }
      } else if (updateData.assigneeId && updateData.assigneeId !== oldRequest?.assigneeId) {
        pendingNotifications.push({
          userId: updateData.assigneeId,
          title: "📌 You have a new assignment",
          message: `Request: ${oldRequest?.code} - ${updateData.title || oldRequest?.title}`,
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
              title: "✅ Request completed",
              message: `Code: ${oldRequest.code} has been marked as Completed`,
              type: "STATUS_CHANGE",
              link: `/requests/${id}`
            });
          }
        }
      }

      if (sroItemsJson !== null) {
        const sroItems: SROItem[] = JSON.parse(sroItemsJson as string || "[]");
        
        // 1. Get current items in DB
        const existingItems = await tx.serviceRequestItem.findMany({
          where: { requestId: id }
        });

        // 2. Identify items to keep/update and new items
        const itemsToKeep = sroItems.filter(newItem => 
          existingItems.some(ex => ex.sroRuleId === newItem.sroRuleId)
        );
        const itemsToAdd = sroItems.filter(newItem => 
          !existingItems.some(ex => ex.sroRuleId === newItem.sroRuleId)
        );
        const itemIdsToKeep = itemsToKeep.map(i => i.sroRuleId);
        const itemsToDelete = existingItems.filter(ex => !itemIdsToKeep.includes(ex.sroRuleId));

        // 3. Update quantity for old items
        for (const item of itemsToKeep) {
          await tx.serviceRequestItem.updateMany({
            where: { requestId: id, sroRuleId: item.sroRuleId },
            data: { quantity: item.quantity }
          });
        }

        // 4. Create new items
        for (const item of itemsToAdd) {
          await tx.serviceRequestItem.create({
            data: {
              requestId: id,
              sroRuleId: item.sroRuleId,
              quantity: item.quantity
            }
          });
        }

        // 5. Delete items not in new list (only if no WorkLogs attached)
        for (const item of itemsToDelete) {
          const hasLogs = await tx.workLog.findFirst({
            where: { serviceRequestItemId: item.id }
          });
          
          if (!hasLogs) {
            await tx.serviceRequestItem.delete({ where: { id: item.id } });
          }
          // If has logs, keep item to prevent Foreign Key error
        }
      }
    }, {
      timeout: 20000 // Increase timeout to 20 seconds for safety
    });

    // 2. Send system notifications after successful transaction
    if (pendingNotifications.length > 0) {
      // Run asynchronously to not block user response
      Promise.all(pendingNotifications.map(n => createNotification(n)))
        .catch(err => console.error("Delayed notifications failed:", err));
    }

    // Send Email notifications outside Transaction
    try {
      if (formData.has("assigneeIds") && assigneeIds) {
        const req = await prisma.serviceRequest.findUnique({ where: { id }, include: { client: true } });
        if (req && req.assigneeIds) {
          const ids = req.assigneeIds.split(",").filter(Boolean);
          for (const uid of ids) {
            const user = await prisma.user.findUnique({ where: { id: uid } });
            if (user) await NotificationService.notifyAssignment(req, user);
          }
        }
      } else if (assigneeId && formData.has("assigneeId")) {
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
    return { error: `Update error: ${error.message}` };
  }
}

export async function updateRequestStatus(id: string, status: string) {
  try {
    const session = await auth();
    if (!session) return { error: "You need to log in" };

    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      include: { 
        items: { select: { id: true, sroRule: { select: { taskName: true } } } },
        workLogs: { select: { serviceRequestItemId: true } }
      }
    });

    if (!currentRequest) return { error: "Request does not exist" };

    if (status === "DONE") {
      const isAssignee = currentRequest.assigneeId === session.user?.id ||
        (currentRequest.assigneeIds && currentRequest.assigneeIds.split(",").map(id => id.trim()).includes(session.user?.id || ""));
      const isAdmin = session.user?.role === "ADMIN";
      const isTAS = session.user?.role === "TAS";

      if (!isAssignee && !isAdmin && !isTAS) {
        return { error: "You do not have permission to complete this request" };
      }

      // Check if ALL SRO items have been logged
      const loggedItemIds = new Set(
        currentRequest.workLogs
          .map(log => log.serviceRequestItemId)
          .filter(Boolean)
      );

      const unloggedItems = currentRequest.items.filter(item => !loggedItemIds.has(item.id));

      if (unloggedItems.length > 0) {
        const itemNames = unloggedItems.map(item => item.sroRule.taskName).join(", ");
        return { 
          error: `Time not logged for the following SRO items: ${itemNames}. Please log all items before completing.` 
        };
      }
    }

    const statusLabels: Record<string, string> = {
      "TODO": "New",
      "IN_PROGRESS": "In Progress",
      "DONE": "Completed",
      "PAUSED": "Paused",
      "CLOSED": "Closed"
    };
    const oldLabel = statusLabels[currentRequest.status] || currentRequest.status;
    const newLabel = statusLabels[status] || status;

    await prisma.$transaction([
      prisma.serviceRequest.update({
        where: { id },
        data: { status }
      }),
      prisma.auditLog.create({
        data: {
          requestId: id,
          userId: session.user?.id,
          action: "UPDATE_STATUS",
          details: `Quick status change from "${oldLabel}" to "${newLabel}"`
        }
      })
    ]);

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
        "TODO": "New",
        "IN_PROGRESS": "In Progress",
        "DONE": "Completed",
        "PAUSED": "Paused",
        "CLOSED": "Closed"
      };

      for (const targetId of targets) {
        if (targetId !== session.user?.id) {
          await createNotification({
            userId: targetId,
            title: `🔄 Status changed: ${statusLabels[status] || status}`,
            message: `Request ${req.code} moved to "${statusLabels[status] || status}" by ${session.user?.name}`,
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
              title: "✅ Request completed",
              message: `Code: ${req.code} completed by ${session.user?.name}`,
              type: "STATUS_CHANGE",
              link: `/requests/${id}`
            });

            // Email for Admin
            if (admin.email) {
              await NotificationService.notifyStatusChange(req, currentRequest.status, status, admin);
            }
          }
        }
      }

      // Notify Assignee/Creator via email
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
    if (!session) return { error: "You need to log in" };

    const currentRequest = await prisma.serviceRequest.findUnique({
      where: { id },
      select: { createdById: true, status: true }
    });

    if (!currentRequest) return { error: "Request does not exist" };

    const isAdmin = session.user?.role === "ADMIN";
    const isCreator = currentRequest.createdById === session.user?.id;
    const isTodo = currentRequest.status === "TODO";

    // Security: Admin or (Creator + status TODO)
    if (!isAdmin && !(isCreator && isTodo)) {
      return { error: "You do not have permission to delete this request (Only deletable when in TODO status or if you are Admin)" };
    }

    await prisma.serviceRequest.delete({ where: { id } });
    revalidatePath("/requests");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getAllRequestsForExport(filters: { search?: string, status?: string, mine?: boolean }) {
  try {
    const session = await auth();
    if (!session) return { error: "Unauthorized" };

    const { search, status, mine } = filters;
    let whereClause: any = {};

    if (search) {
      whereClause.OR = [
        { code: { contains: search } },
        { title: { contains: search } },
        { client: { name: { contains: search } } },
        { client: { code: { contains: search } } }
      ];
    }

    if (status && status !== "ALL") {
      whereClause.status = status;
    }

    if (mine) {
      whereClause.OR = [
        ...(whereClause.OR || []),
        { assigneeId: session.user.id },
        { assigneeIds: { contains: session.user.id } }
      ];
    }

    const requests = await prisma.serviceRequest.findMany({
      where: whereClause,
      include: {
        client: true,
        package: true,
        assignee: true,
        creator: true,
        items: { include: { sroRule: true } },
        slaLines: true,
        workLogs: true,
        slaUpdateEntries: true,
      },
      orderBy: { raiseDate: "desc" }
    });

    return { success: true, requests };
  } catch (error: any) {
    return { error: error.message };
  }
}
