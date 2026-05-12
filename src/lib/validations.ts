import { z } from "zod";

export const requestSchema = z.object({
  title: z.string().min(5, "Tiêu đề phải ít nhất 5 ký tự").max(200),
  description: z.string().min(10, "Mô tả phải ít nhất 10 ký tự"),
  userRequirement: z.string().optional(),
  clientId: z.string().min(1, "Vui lòng chọn khách hàng"),
  packageId: z.string().min(1, "Vui lòng chọn gói Premium"),
  type: z.enum(["TASK", "BUG", "FEATURE", "URGENT"]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
  deadline: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  items: z.array(z.object({
    sroRuleId: z.string(),
    quantity: z.number().min(1)
  })).min(1, "Phải chọn ít nhất 1 nghiệp vụ SRO")
});

export const workLogSchema = z.object({
  requestId: z.string().min(1),
  hours: z.number().min(0.1, "Số giờ phải lớn hơn 0"),
  description: z.string().min(5, "Vui lòng mô tả công việc đã làm"),
  subTaskId: z.string().optional().nullable(),
  serviceRequestItemId: z.string().optional().nullable(),
});

export const subTaskSchema = z.object({
  requestId: z.string().min(1),
  content: z.string().min(3, "Nội dung sub-task quá ngắn"),
  description: z.string().optional().nullable(),
});

export const commentSchema = z.object({
  requestId: z.string().min(1),
  content: z.string().min(1, "Bình luận không được để trống"),
});
