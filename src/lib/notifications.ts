import { sendMail } from "./mail";
import { prisma } from "./prisma";

export const NotificationService = {
  /**
   * Helper to wrap HTML in a premium layout
   */
  getPremiumTemplate(content: string, title: string) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            .container { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; text-transform: uppercase; }
            .content { padding: 40px; color: #334155; line-height: 1.6; }
            .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
            .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: #ffffff !important; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; margin-top: 24px; transition: all 0.2s; }
            .badge { display: inline-block; padding: 4px 12px; border-radius: 6px; font-size: 11px; font-weight: 800; text-transform: uppercase; margin-bottom: 16px; }
            .badge-blue { background: #eff6ff; color: #2563eb; }
            .info-box { background: #f8fafc; border-radius: 12px; padding: 20px; margin: 24px 0; border: 1px solid #f1f5f9; }
            .label { font-size: 11px; font-weight: 800; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; display: block; }
            .value { font-size: 14px; font-weight: 600; color: #1e293b; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>PREMIUM SERVICE</h1>
            </div>
            <div class="content">
              ${content}
              <center>
                <a href="${process.env.NEXTAUTH_URL}" class="btn">Mở Dashboard / Open Dashboard</a>
              </center>
            </div>
            <div class="footer">
              &copy; 2026 Fujifilm Premium Service Management System<br/>
              This is an automated notification. Please do not reply.
            </div>
          </div>
        </body>
      </html>
    `;
  },

  /**
   * Thông báo khi có Request mới
   */
  async notifyNewRequest(request: any) {
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "TAS"] }, email: { not: null } },
      select: { email: true, name: true }
    });

    for (const admin of admins) {
      if (admin.email) {
        const html = this.getPremiumTemplate(`
          <div class="badge badge-blue">New Service Request</div>
          <h2 style="margin-top: 0;">Chào ${admin.name}, một yêu cầu mới vừa được tạo.</h2>
          <p>Hệ thống ghi nhận yêu cầu dịch vụ mới từ khách hàng cần xử lý.</p>
          
          <div class="info-box">
            <div style="margin-bottom: 16px;">
              <span class="label">Mã yêu cầu (Request ID)</span>
              <span class="value">${request.code}</span>
            </div>
            <div style="margin-bottom: 16px;">
              <span class="label">Tiêu đề (Title)</span>
              <span class="value">${request.title}</span>
            </div>
            <div>
              <span class="label">Khách hàng (Client)</span>
              <span class="value">${request.client?.name || 'N/A'}</span>
            </div>
          </div>
          
          <p style="font-size: 13px; color: #64748b;">Vui lòng truy cập hệ thống để giao việc cho kỹ sư thực hiện.</p>
        `, `New Request: ${request.code}`);

        await sendMail({ to: admin.email, subject: `[NEW] ${request.code}: ${request.title}`, html });
      }
    }
  },

  /**
   * Thông báo khi giao việc (Assignment)
   */
  async notifyAssignment(request: any, assignee: any) {
    if (!assignee.email) return;

    const html = this.getPremiumTemplate(`
      <div class="badge badge-blue">Task Assigned</div>
      <h2 style="margin-top: 0;">Chào ${assignee.name}, bạn có nhiệm vụ mới.</h2>
      <p>Bạn đã được chỉ định là người thực hiện chính cho yêu cầu dịch vụ sau:</p>
      
      <div class="info-box">
        <div style="margin-bottom: 16px;">
          <span class="label">Mã yêu cầu (Request ID)</span>
          <span class="value">${request.code}</span>
        </div>
        <div>
          <span class="label">Yêu cầu (Title)</span>
          <span class="value">${request.title}</span>
        </div>
      </div>
      
      <p style="font-size: 13px; color: #64748b;">Vui lòng kiểm tra các hạng mục công việc (SRO) và bắt đầu thực hiện.</p>
    `, `Assigned: ${request.code}`);

    await sendMail({ to: assignee.email, subject: `[ASSIGNED] ${request.code}: ${request.title}`, html });
  },

  /**
   * Thông báo khi đổi trạng thái
   */
  async notifyStatusChange(request: any, oldStatus: string, newStatus: string, targetUser: any) {
    if (!targetUser?.email) return;

    const html = this.getPremiumTemplate(`
      <div class="badge badge-blue">Status Updated</div>
      <h2 style="margin-top: 0;">Cập nhật trạng thái yêu cầu</h2>
      <p>Yêu cầu <strong>${request.code}</strong> đã được chuyển trạng thái:</p>
      
      <div class="info-box" style="text-align: center;">
        <span style="color: #94a3b8; text-decoration: line-through; font-size: 14px;">${oldStatus}</span>
        <span style="margin: 0 16px; color: #2563eb; font-size: 20px;">&rarr;</span>
        <span style="color: #2563eb; font-weight: 800; font-size: 18px; text-transform: uppercase;">${newStatus}</span>
      </div>
    `, `Status Change: ${request.code}`);

    await sendMail({ to: targetUser.email, subject: `[STATUS] ${request.code}: ${newStatus}`, html });
  },

  /**
   * Thông báo khi có comment mới
   */
  async notifyNewComment(request: any, comment: any, authorName: string) {
    // Thông báo cho Assignee và Creator (trừ người vừa comment)
    const recipients = [];
    if (request.assignee?.email) recipients.push({ email: request.assignee.email, name: request.assignee.name });
    if (request.creator?.email) recipients.push({ email: request.creator.email, name: request.creator.name });

    // Lọc bỏ người trùng và người vừa comment
    const finalRecipients = recipients.filter((r, idx, self) => 
      r.email && 
      r.email !== comment.userEmail && 
      self.findIndex(t => t.email === r.email) === idx
    );

    for (const person of finalRecipients) {
      const html = this.getPremiumTemplate(`
        <div class="badge badge-blue">New Comment</div>
        <h2 style="margin-top: 0;">Thảo luận mới từ ${authorName}</h2>
        <p>Có phản hồi mới trong yêu cầu <strong>${request.code}</strong>:</p>
        
        <div class="info-box" style="border-left: 4px solid #2563eb;">
          <p style="margin: 0; font-style: italic; color: #475569;">"${comment.content}"</p>
        </div>
      `, `New Comment: ${request.code}`);

      await sendMail({ to: person.email, subject: `[COMMENT] ${request.code}: ${authorName} phản hồi`, html });
    }
  }
};
