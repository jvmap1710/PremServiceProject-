"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getEmailSettings() {
  try {
    const settings = await prisma.emailSetting.findUnique({
      where: { id: "SYSTEM_CONFIG" }
    });
    return { success: true, settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateEmailSettings(data: any) {
  try {
    const settings = await prisma.emailSetting.upsert({
      where: { id: "SYSTEM_CONFIG" },
      update: {
        host: data.host,
        port: parseInt(data.port),
        secure: data.secure,
        user: data.user,
        password: data.password,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
      },
      create: {
        id: "SYSTEM_CONFIG",
        host: data.host,
        port: parseInt(data.port),
        secure: data.secure,
        user: data.user,
        password: data.password,
        fromEmail: data.fromEmail,
        fromName: data.fromName,
      }
    });
    revalidatePath("/admin/settings");
    return { success: true, settings };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function testEmailAction(toEmail: string) {
  try {
    const { sendMail } = await import("@/lib/mail");
    const result = await sendMail({
      to: toEmail,
      subject: "Test Email from Premium Service",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Premium Service System</h2>
          <p>This is a test email to verify your SMTP settings.</p>
          <p>If you received this, your email configuration is working correctly!</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b;">Sent at: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    return result;
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
