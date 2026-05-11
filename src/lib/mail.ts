import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

export async function sendMail({ to, subject, html }: { to: string, subject: string, html: string }) {
  try {
    const settings = await prisma.emailSetting.findUnique({
      where: { id: "SYSTEM_CONFIG" }
    });

    if (!settings) {
      throw new Error("Email settings not configured");
    }

    console.log(`[MAIL DEBUG] Host: ${settings.host}, Port: ${settings.port}, Secure: ${settings.secure}, User: ${settings.user}, Pass: ${settings.password ? '********' : 'EMPTY'}`);

    console.log(`Attempting to send email to ${to} via ${settings.host}:${settings.port} (Secure: ${settings.secure})`);

    const transporter = nodemailer.createTransport({
      host: settings.host,
      port: settings.port,
      secure: settings.secure,
      auth: {
        user: settings.user,
        pass: settings.password,
      },
      tls: {
        // Do not fail on invalid certs (common for dev/local)
        rejectUnauthorized: false,
        // Force TLS version if needed, but usually not required
        // minVersion: 'TLSv1.2'
      },
      // Some servers require this for 587
      requireTLS: settings.port === 587,
    });

    const info = await transporter.sendMail({
      from: `"${settings.fromName}" <${settings.user}>`, // Use the authenticated user email directly
      to,
      subject,
      text: html.replace(/<[^>]*>?/gm, ''), // Simple HTML to text conversion
      html,
      headers: {
        'X-Priority': '1 (Highest)',
        'X-Mailer': 'PremiumService-Notifier'
      }
    });

    return { success: true, messageId: info.messageId };
  } catch (error: any) {
    console.error("Mail Error:", error);
    return { success: false, error: error.message };
  }
}
