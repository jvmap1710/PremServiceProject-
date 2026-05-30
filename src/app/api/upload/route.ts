import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import sharp from "sharp";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const requestId = formData.get("requestId") as string;

    if (!file || !requestId) {
      return NextResponse.json({ error: "Missing file or requestId" }, { status: 400 });
    }

    // 1. Check File Size (Max 20MB to prevent DoS)
    const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds maximum size of 20MB" }, { status: 413 });
    }

    // 2. Reject dangerous file types
    const dangerousExtensions = ['.exe', '.sh', '.bat', '.php', '.js', '.vbs', '.cmd'];
    const fileName = file.name.toLowerCase();
    if (dangerousExtensions.some(ext => fileName.endsWith(ext))) {
      return NextResponse.json({ error: "File type not allowed" }, { status: 415 });
    }

    let buffer = Buffer.from(await file.arrayBuffer());
    let fileType = file.type;

    // Optional: Compress image if it's an image type to save DB space
    if (fileType.startsWith("image/") && fileType !== "image/svg+xml") {
      try {
        buffer = (await sharp(buffer)
          .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
          .jpeg({ quality: 80 })
          .toBuffer()) as any;
        fileType = "image/jpeg"; // Standardize to jpeg after compression
      } catch (sharpError) {
        console.error("Compression failed, using original:", sharpError);
      }
    }

    // Save to DB and Log action
    const finalAttachment = await prisma.$transaction(async (tx) => {
      const att = await tx.attachment.create({
        data: {
          filename: file.name,
          url: "PENDING",
          fileType: fileType,
          size: buffer.length,
          data: buffer,
          requestId,
          userId: session.user?.id,
        },
      });

      const updatedAtt = await tx.attachment.update({
        where: { id: att.id },
        data: { url: `/api/evidence/${att.id}` }
      });

      await (tx as any).auditLog.create({
        data: {
          requestId,
          userId: session.user?.id,
          action: "UPLOAD_EVIDENCE",
          details: `Uploaded file: ${file.name}`,
        }
      });

      return updatedAtt;
    });

    return NextResponse.json({ success: true, attachment: finalAttachment });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Upload failed: " + error.message }, { status: 500 });
  }
}
