import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const attachment = await prisma.attachment.findUnique({
      where: { id },
      select: {
        data: true,
        fileType: true,
        filename: true,
      },
    });

    if (!attachment || !attachment.data) {
      return new NextResponse("Not Found", { status: 404 });
    }

    // Return the binary data with correct headers
    return new NextResponse(attachment.data, {
      headers: {
        "Content-Type": attachment.fileType || "application/octet-stream",
        "Content-Disposition": `inline; filename="${encodeURIComponent(attachment.filename)}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Evidence serve error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
