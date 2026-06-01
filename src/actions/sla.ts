"use server";

import { prisma } from "@/lib/prisma";
import { calculateWorkingHours } from "@/lib/sla";
import { revalidatePath } from "next/cache";

/**
 * Get all SLA lines for a specific ServiceRequest.
 */
export async function getSlaLines(requestId: string) {
  return prisma.slaLine.findMany({
    where: { requestId },
    orderBy: { createdAt: "asc" },
  });
}

/**
 * Add a new SLA line to a ticket.
 * Automatically looks up and fills SLA targets from the ticket's package.
 */
export async function addSlaLine(
  requestId: string,
  data: {
    title: string;
    priority: string;
    ticketType: string;
    ticketRequestDateTime?: string | null;
  }
) {
  try {
    // Fetch request to get packageId
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { packageId: true },
    });

    if (!request) return { error: "Ticket not found" };

    // Fetch SLA target from SlaTarget table
    const slaTarget = await prisma.slaTarget.findUnique({
      where: {
        packageId_priority_ticketType: {
          packageId: request.packageId,
          priority: data.priority,
          ticketType: data.ticketType,
        },
      },
    });

    const ticketReqDT = data.ticketRequestDateTime ? new Date(data.ticketRequestDateTime) : null;

    const line = await prisma.slaLine.create({
      data: {
        requestId,
        title: data.title,
        priority: data.priority,
        ticketType: data.ticketType,
        ticketRequestDateTime: ticketReqDT,
        ackSlaTarget: slaTarget?.ackTargetHours ?? null,
        responseSlaTarget: slaTarget?.responseTargetHours ?? null,
        updateFreqSlaTarget: slaTarget?.updateFreqTargetHours ?? null,
      },
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    revalidatePath(`/requests`);
    revalidatePath(`/`);
    return { success: true, line };
  } catch (error: any) {
    console.error("addSlaLine error:", error);
    return { error: error.message || "Failed to add SLA line" };
  }
}

/**
 * Update SLA line fields.
 * Handles auto-calculation of working hours and auto-fill of SLA targets.
 */
export async function updateSlaLine(
  lineId: string,
  requestId: string,
  data: {
    title?: string;
    priority?: string;
    ticketType?: string;
    ticketRequestDateTime?: string | null;
    ackDateTime?: string | null;
    actualAckTime?: number | null;
    responseDateTime?: string | null;
    actualResponseTime?: number | null;
    customerResponseDateTime?: string | null;
    updateDateTime?: string | null;
    actualUpdateFrequency?: number | null;
    updateNote?: string | null;
  }
) {
  try {
    const currentLine = await prisma.slaLine.findUnique({
      where: { id: lineId },
      include: {
        request: { select: { packageId: true } }
      }
    });

    if (!currentLine) return { error: "SLA line not found" };

    const updateData: Record<string, any> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.ticketType !== undefined) updateData.ticketType = data.ticketType;
    if (data.updateNote !== undefined) updateData.updateNote = data.updateNote;

    const priority = data.priority || currentLine.priority;
    const ticketType = data.ticketType || currentLine.ticketType;

    // Parse DateTimes
    const ticketReqDT = data.ticketRequestDateTime !== undefined
      ? (data.ticketRequestDateTime ? new Date(data.ticketRequestDateTime) : null)
      : currentLine.ticketRequestDateTime;

    const ackDT = data.ackDateTime !== undefined
      ? (data.ackDateTime ? new Date(data.ackDateTime) : null)
      : currentLine.ackDateTime;

    const respDT = data.responseDateTime !== undefined
      ? (data.responseDateTime ? new Date(data.responseDateTime) : null)
      : currentLine.responseDateTime;

    const custRespDT = data.customerResponseDateTime !== undefined
      ? (data.customerResponseDateTime ? new Date(data.customerResponseDateTime) : null)
      : currentLine.customerResponseDateTime;

    const updateDT = data.updateDateTime !== undefined
      ? (data.updateDateTime ? new Date(data.updateDateTime) : null)
      : currentLine.updateDateTime;

    if (data.ticketRequestDateTime !== undefined) updateData.ticketRequestDateTime = ticketReqDT;
    if (data.ackDateTime !== undefined) updateData.ackDateTime = ackDT;
    if (data.responseDateTime !== undefined) updateData.responseDateTime = respDT;
    if (data.customerResponseDateTime !== undefined) updateData.customerResponseDateTime = custRespDT;
    if (data.updateDateTime !== undefined) updateData.updateDateTime = updateDT;

    // Auto-calculate Actual Ack Time
    if (data.actualAckTime !== undefined) {
      updateData.actualAckTime = data.actualAckTime;
    } else if (ticketReqDT && ackDT) {
      updateData.actualAckTime = await calculateWorkingHours(ticketReqDT, ackDT);
    } else if (data.ackDateTime !== undefined && ackDT === null) {
      updateData.actualAckTime = null;
    }

    // Auto-calculate Actual Response Time
    if (data.actualResponseTime !== undefined) {
      updateData.actualResponseTime = data.actualResponseTime;
    } else if (ticketReqDT && respDT) {
      updateData.actualResponseTime = await calculateWorkingHours(ticketReqDT, respDT);
    } else if (data.responseDateTime !== undefined && respDT === null) {
      updateData.actualResponseTime = null;
    }

    // Auto-calculate Actual Update Frequency
    if (data.actualUpdateFrequency !== undefined) {
      updateData.actualUpdateFrequency = data.actualUpdateFrequency;
    } else if (custRespDT && updateDT) {
      updateData.actualUpdateFrequency = await calculateWorkingHours(custRespDT, updateDT);
    } else if (updateDT) {
      // Find siblings to get previous updateDateTime
      const siblings = await prisma.slaLine.findMany({
        where: { requestId: currentLine.requestId },
        orderBy: { createdAt: "asc" },
      });
      const currentIndex = siblings.findIndex(s => s.id === lineId);
      if (currentIndex > 0) {
        const prevLine = siblings[currentIndex - 1];
        const baseDT = prevLine.updateDateTime || prevLine.createdAt;
        updateData.actualUpdateFrequency = await calculateWorkingHours(new Date(baseDT), updateDT);
      } else {
        // First line: use ticketRequestDateTime or createdAt as base
        const baseDT = ticketReqDT || currentLine.createdAt;
        updateData.actualUpdateFrequency = await calculateWorkingHours(new Date(baseDT), updateDT);
      }
    } else if (data.updateDateTime !== undefined && updateDT === null) {
      updateData.actualUpdateFrequency = null;
    }

    // Auto-fill SLA Targets if priority or type changed
    if (data.priority !== undefined || data.ticketType !== undefined) {
      const slaTarget = await prisma.slaTarget.findUnique({
        where: {
          packageId_priority_ticketType: {
            packageId: currentLine.request.packageId,
            priority,
            ticketType,
          },
        },
      });
      updateData.ackSlaTarget = slaTarget?.ackTargetHours ?? null;
      updateData.responseSlaTarget = slaTarget?.responseTargetHours ?? null;
      updateData.updateFreqSlaTarget = slaTarget?.updateFreqTargetHours ?? null;
    }

    await prisma.slaLine.update({
      where: { id: lineId },
      data: updateData,
    });

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    revalidatePath(`/requests`);
    revalidatePath(`/`);
    return { success: true };
  } catch (error: any) {
    console.error("updateSlaLine error:", error);
    return { error: error.message || "Failed to update SLA line" };
  }
}

/**
 * Delete an SLA line.
 */
export async function deleteSlaLine(lineId: string, requestId: string) {
  try {
    await prisma.slaLine.delete({ where: { id: lineId } });
    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    revalidatePath(`/requests`);
    revalidatePath(`/`);
    return { success: true };
  } catch (error: any) {
    console.error("deleteSlaLine error:", error);
    return { error: error.message || "Failed to delete SLA line" };
  }
}

/**
 * Recalculate actualUpdateFrequency for all SLA Update Entries of a request.
 * Follows the formula:
 * 1. If customerResponseDateTime is NOT null/empty, Freq Actual = updateDateTime - customerResponseDateTime (working hours)
 * 2. If customerResponseDateTime is null/empty, Freq Actual = updateDateTime - previous entry's updateDateTime (working hours)
 *    If it is the first entry and customerResponseDateTime is empty, Freq Actual = updateDateTime - ticketRequestDateTime / raiseDate
 */
export async function recalculateAllUpdateFrequencies(requestId: string) {
  try {
    // 1. Fetch all update entries in chronological order (createdAt: "asc")
    const entries = await prisma.slaUpdateEntry.findMany({
      where: { requestId },
      orderBy: { createdAt: "asc" },
    });

    // 2. Fetch the request to get raiseDate as fallback base time
    const request = await prisma.serviceRequest.findUnique({
      where: { id: requestId },
      select: { raiseDate: true },
    });
    const fallbackBaseDT = request?.raiseDate || new Date();

    // 3. Fetch first SLA line's ticketRequestDateTime as first-priority fallback base time
    const firstLine = await prisma.slaLine.findFirst({
      where: { requestId },
      orderBy: { createdAt: "asc" },
      select: { ticketRequestDateTime: true },
    });
    const firstBaseDT = firstLine?.ticketRequestDateTime || fallbackBaseDT;

    // 4. Iterate and recalculate
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const custRespDT = entry.customerResponseDateTime;
      const updateDT = entry.updateDateTime;

      let actualFreq: number | null = null;
      if (custRespDT) {
        // 1. nếu customer dt not empty thì lấy team update - customer dt
        actualFreq = await calculateWorkingHours(custRespDT, updateDT);
      } else {
        // 2. nếu customer dt empty thì lấy teamupdate - teamupdate liền kề (cột trên).
        if (i > 0) {
          const prevEntry = entries[i - 1];
          actualFreq = await calculateWorkingHours(prevEntry.updateDateTime, updateDT);
        } else {
          // First entry, no customer response: use firstBaseDT
          actualFreq = await calculateWorkingHours(firstBaseDT, updateDT);
        }
      }

      // Update in database if it changed
      if (entry.actualUpdateFrequency !== actualFreq) {
        await prisma.slaUpdateEntry.update({
          where: { id: entry.id },
          data: { actualUpdateFrequency: actualFreq },
        });
      }
    }
  } catch (error) {
    console.error("recalculateAllUpdateFrequencies error:", error);
  }
}

/**
 * Add a new SLA Update Entry (Update Frequency row).
 */
export async function addSlaUpdateEntry(
  requestId: string,
  data: {
    customerResponseDateTime?: string | null;
    updateDateTime: string;
    actualUpdateFrequency?: number | null;
    note?: string | null;
  }
) {
  try {
    const custRespDT = data.customerResponseDateTime
      ? new Date(data.customerResponseDateTime)
      : null;
    const updateDT = new Date(data.updateDateTime);

    const entry = await prisma.slaUpdateEntry.create({
      data: {
        requestId,
        customerResponseDateTime: custRespDT,
        updateDateTime: updateDT,
        actualUpdateFrequency: data.actualUpdateFrequency ?? null,
        note: data.note || null,
      },
    });

    // Automatically recalculate all update frequencies for absolute consistency
    await recalculateAllUpdateFrequencies(requestId);

    revalidatePath(`/requests/${requestId}`);
    return { success: true, entry };
  } catch (error: any) {
    console.error("addSlaUpdateEntry error:", error);
    return { error: error.message || "Failed to add update entry" };
  }
}

/**
 * Update an existing SLA Update Entry.
 */
export async function updateSlaUpdateEntry(
  entryId: string,
  requestId: string,
  data: {
    customerResponseDateTime?: string | null;
    updateDateTime?: string | null;
    actualUpdateFrequency?: number | null;
    note?: string | null;
  }
) {
  try {
    const updateData: Record<string, any> = {};

    if (data.customerResponseDateTime !== undefined) {
      updateData.customerResponseDateTime = data.customerResponseDateTime
        ? new Date(data.customerResponseDateTime)
        : null;
    }
    if (data.updateDateTime) {
      updateData.updateDateTime = new Date(data.updateDateTime);
    }
    if (data.actualUpdateFrequency !== undefined) {
      updateData.actualUpdateFrequency = data.actualUpdateFrequency;
    }
    if (data.note !== undefined) {
      updateData.note = data.note;
    }

    await prisma.slaUpdateEntry.update({
      where: { id: entryId },
      data: updateData,
    });

    // Recalculate to update the frequency and all subsequent entries
    await recalculateAllUpdateFrequencies(requestId);

    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (error: any) {
    console.error("updateSlaUpdateEntry error:", error);
    return { error: error.message || "Failed to update entry" };
  }
}

/**
 * Delete an SLA Update Entry.
 */
export async function deleteSlaUpdateEntry(entryId: string, requestId: string) {
  try {
    await prisma.slaUpdateEntry.delete({ where: { id: entryId } });

    // Recalculate to shift dependencies and ensure exact correctness
    await recalculateAllUpdateFrequencies(requestId);

    revalidatePath(`/requests/${requestId}`);
    return { success: true };
  } catch (error: any) {
    console.error("deleteSlaUpdateEntry error:", error);
    return { error: error.message || "Failed to delete entry" };
  }
}

/**
 * Recalculate all SLA working hours and update frequencies for a request.
 * Called when working hours config or holidays change.
 */
export async function recalculateSlaForRequest(requestId: string) {
  try {
    const slaLines = await prisma.slaLine.findMany({
      where: { requestId },
      select: {
        id: true,
        ticketRequestDateTime: true,
        ackDateTime: true,
        responseDateTime: true,
      },
    });

    for (const line of slaLines) {
      const updateData: Record<string, any> = {};

      if (line.ticketRequestDateTime && line.ackDateTime) {
        updateData.actualAckTime = await calculateWorkingHours(
          line.ticketRequestDateTime,
          line.ackDateTime
        );
      }

      if (line.ticketRequestDateTime && line.responseDateTime) {
        updateData.actualResponseTime = await calculateWorkingHours(
          line.ticketRequestDateTime,
          line.responseDateTime
        );
      }

      if (Object.keys(updateData).length > 0) {
        await prisma.slaLine.update({
          where: { id: line.id },
          data: updateData,
        });
      }
    }

    // Also recalculate all update frequency rows sequentially
    await recalculateAllUpdateFrequencies(requestId);

    revalidatePath(`/requests/${requestId}`);
    revalidatePath(`/requests/kanban`);
    revalidatePath(`/requests`);
    revalidatePath(`/`);
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

