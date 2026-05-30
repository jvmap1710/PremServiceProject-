import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { id } = await params;
    
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        request: {
          select: {
            createdById: true,
            assigneeId: true,
            assigneeIds: true,
            client: { select: { ownerId: true } }
          }
        }
      }
    });

    if (!attachment || !attachment.data) {
      return new NextResponse("Not Found", { status: 404 });
    }

    const userId = session.user?.id;
    const userRole = (session.user as any)?.role;
    const isAdmin = userRole === "ADMIN" || userRole === "TAS";
    
    // Authorization check
    if (!isAdmin && attachment.request) {
      const req = attachment.request;
      const isCreator = req.createdById === userId;
      const isAssignee = req.assigneeId === userId || (req.assigneeIds && req.assigneeIds.split(',').map(i => i.trim()).includes(userId || ""));
      const isClientOwner = req.client?.ownerId === userId;
      
      if (!isCreator && !isAssignee && !isClientOwner) {
        return new NextResponse("Forbidden", { status: 403 });
      }
    }

    // Return the binary data with correct headers (attachment to prevent XSS)
    return new NextResponse(attachment.data, {
      headers: {
        "Content-Type": attachment.fileType || "application/octet-stream",
        "Content-Disposition": `attachment; filename="${encodeURIComponent(attachment.filename)}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Evidence serve error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
