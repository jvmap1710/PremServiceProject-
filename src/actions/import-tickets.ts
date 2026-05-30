"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { generateTicketCode } from "@/lib/generate-code";

export async function importTicketsBulk(rows: any[]) {
  const session = await auth();
  if (!session?.user) {
    return { error: "Unauthorized" };
  }

  try {
    const results = {
      success: 0,
      errors: [] as string[]
    };

    // Pre-fetch all clients to validate Customer Codes in memory
    const allClients = await prisma.client.findMany({
      include: {
        packages: {
          where: { isActive: true }
        }
      }
    });

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2; // Assuming row 1 is header

      const customerCode = (row["Customer Code"] || row["Customer Code "] || "").toString().trim();
      const ticketCode = (row["Ticket Code"] || row["Ticket No."] || row["Ticket No"] || "").toString().trim();
      let title = (row["Ticket Title"] || "Imported Ticket").toString().trim();
      // Remove prefixes like "[ SMC - P2 Incident ] - ", "[SMC] - Standard Request - ", etc.
      title = title.replace(/^\[.*?\]\s*-?\s*/, '').replace(/^(Standard request|Standard Request|Non-Standard Request|Incident|Problem)\s*-\s*/i, '').trim();

      const description = (row["Ticket Detail"] || "Imported from Excel").toString().trim();
      const raiseDateRaw = row["Ticket Request Datetime"] || row["Ticket Request Date"];
      let rawType = (row["Request Classification"] || row["Request Type"] || "OTHERS").toString().trim().toUpperCase();
      let requestType = "OTHERS";
      if (rawType.includes("INCIDENT")) requestType = "INCIDENT";
      else if (rawType.includes("PROBLEM")) requestType = "PROBLEM";
      else if (rawType.includes("NON-STANDARD") || rawType.includes("NON STANDARD") || rawType.includes("NSRO")) requestType = "NSRO";
      else if (rawType.includes("STANDARD") || rawType.includes("SRO")) requestType = "SRO";
      else if (rawType.includes("HEALTH")) requestType = "HEALTH_CHECK";

      const priority = (row["Priority Level"] || "P4").toString().trim().toUpperCase();
      
      let rawStatus = (row["Status"] || "TODO").toString().trim().toUpperCase();
      let status = "TODO";
      if (rawStatus.includes("CLOSED")) status = "CLOSED";
      else if (rawStatus.includes("DONE") || rawStatus.includes("COMPLETED") || rawStatus.includes("COMPLETE")) status = "DONE";
      else if (rawStatus.includes("PROGRESS") || rawStatus.includes("ONGOING")) status = "IN_PROGRESS";
      else if (rawStatus.includes("PAUSE") || rawStatus.includes("HOLD") || rawStatus.includes("PENDING")) status = "PAUSED";

      if (!customerCode) {
        results.errors.push(`Row ${rowNum}: Missing Customer Code`);
        continue;
      }

      const client = allClients.find(c => 
        c.code.toLowerCase() === customerCode.toLowerCase() || 
        c.name.toLowerCase() === customerCode.toLowerCase()
      );
      if (!client) {
        results.errors.push(`Row ${rowNum}: Customer Code '${customerCode}' does not exist in the system. Please standardize or create it first.`);
        continue;
      }

      const activePackage = client.packages[0];
      if (!activePackage) {
        results.errors.push(`Row ${rowNum}: Client '${customerCode}' has no active Premium Package.`);
        continue;
      }

      // Check if ticket already exists
      let request = null;
      if (ticketCode) {
        request = await prisma.serviceRequest.findUnique({
          where: { code: String(ticketCode) }
        });
      }

      let raiseDate = new Date();
      if (raiseDateRaw) {
         const parsed = new Date(raiseDateRaw);
         if (!isNaN(parsed.getTime())) {
           raiseDate = parsed;
         }
      }

      if (!request) {
        // Create new
        const finalCode = ticketCode ? String(ticketCode) : await generateTicketCode(client.id, client.code, raiseDate);

        request = await prisma.serviceRequest.create({
          data: {
            code: finalCode,
            title: String(title),
            userRequirement: String(description),
            description: "",
            status: String(status),
            type: String(requestType),
            priority: String(priority),
            raiseDate: raiseDate,
            clientId: client.id,
            packageId: activePackage.id,
            createdById: session.user.id,
          }
        });
      }

      // Process SLA Line - only create ONE per ticket (skip if already has SLA lines)
      const existingSlaLines = await prisma.slaLine.count({
        where: { requestId: request.id }
      });

      if (existingSlaLines === 0) {
        const ticketItemNo = row["Ticket ID"] || row["Ticket Item No."] || row["Ticket Item No"] || row["Ticket No."] || "Imported Item";
        const ackTarget = row["Acknowledgement SLA Target"] ? parseFloat(row["Acknowledgement SLA Target"]) : null;
        const respTarget = row["Response SLA Target"] ? parseFloat(row["Response SLA Target"]) : null;
        const updateTarget = row["Update Frequency SLA Target"] ? parseFloat(row["Update Frequency SLA Target"]) : null;

        // Try to match SLA target from package template first
        const matchingTarget = await prisma.slaTarget.findFirst({
          where: {
            packageId: activePackage.id,
            ticketType: String(requestType),
            priority: String(priority)
          }
        });

        // Parse dates from Excel
        const ackDate = row["Actual Acknowledgement Datetime"] ? new Date(row["Actual Acknowledgement Datetime"]) : null;
        
        const rawRespDate = row["First Response DateTime"] || row["Actual Response DateTime"] || row["Actual Response Time"];
        const respDate = rawRespDate ? new Date(rawRespDate) : null;
        
        const custReply = row["Customer Response Time (to compare with Actual Update Frequency SLA)"] ? new Date(row["Customer Response Time (to compare with Actual Update Frequency SLA)"]) : null;
        const teamUpdate = row["Actual Update Frequency Time"] || row["Team Update DateTime"] ? new Date(row["Actual Update Frequency Time"] || row["Team Update DateTime"]) : null;

        await prisma.slaLine.create({
          data: {
            requestId: request.id,
            title: String(ticketItemNo),
            ticketType: String(requestType),
            priority: String(priority),
            ticketRequestDateTime: raiseDate,
            
            ackSlaTarget: matchingTarget?.ackTargetHours ?? (isNaN(ackTarget!) ? null : ackTarget),
            actualAckTime: row["Actual Acknowledgement Time (hours)"] ? parseFloat(row["Actual Acknowledgement Time (hours)"]) : null,
            ackDateTime: isNaN(ackDate?.getTime()!) ? null : ackDate,

            responseSlaTarget: matchingTarget?.responseTargetHours ?? (isNaN(respTarget!) ? null : respTarget),
            actualResponseTime: row["Actual Response Time (hours)"] ? parseFloat(row["Actual Response Time (hours)"]) : null,
            responseDateTime: isNaN(respDate?.getTime()!) ? null : respDate,

            completionSlaTarget: matchingTarget?.completionTargetHours ?? null,

            updateFreqSlaTarget: matchingTarget?.updateFreqTargetHours ?? (isNaN(updateTarget!) ? null : updateTarget),
            actualUpdateFrequency: row["Actual Update Frequency (hours)"] ? parseFloat(row["Actual Update Frequency (hours)"]) : null,
            customerResponseDateTime: isNaN(custReply?.getTime()!) ? null : custReply,
            updateDateTime: isNaN(teamUpdate?.getTime()!) ? null : teamUpdate,

            updateNote: row["Update Frequency NOTE"] ? String(row["Update Frequency NOTE"]) : null,
          }
        });
      }

      results.success++;
    }

    revalidatePath("/requests");
    return { data: results };

  } catch (error: any) {
    console.error("Import error:", error);
    return { error: error.message || "Failed to import tickets" };
  }
}
