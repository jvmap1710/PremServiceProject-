import { z } from "zod";

export const requestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters").max(200),
  description: z.string().min(10, "Description must be at least 10 characters"),
  userRequirement: z.string().optional(),
  clientId: z.string().min(1, "Please select a client"),
  packageId: z.string().min(1, "Please select a Premium package"),
  type: z.enum(["INCIDENT", "PROBLEM", "SRO", "NSRO", "OTHERS", "HEALTH_CHECK"]),
  priority: z.enum(["P1", "P2", "P3", "P4"]),
  taskPriority: z.enum(["HIGHEST", "HIGH", "MEDIUM", "LOW", "LOWEST"]).optional().nullable(),
  urgency: z.enum(["IMMEDIATE", "URGENT", "MODERATE", "STANDARD"]).optional().nullable(),
  impact: z.enum(["WIDESPREAD", "LARGE", "LIMITED", "LOCALISED"]).optional().nullable(),
  deadline: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
  items: z.array(z.object({
    sroRuleId: z.string(),
    quantity: z.number().min(1)
  })).min(1, "Must select at least 1 SRO task")
});

export const workLogSchema = z.object({
  requestId: z.string().min(1),
  hours: z.number().min(0.1, "Hours must be greater than 0"),
  description: z.string().min(5, "Please describe the work done"),
  subTaskId: z.string().optional().nullable(),
  serviceRequestItemId: z.string().optional().nullable(),
});

export const subTaskSchema = z.object({
  requestId: z.string().min(1),
  content: z.string().min(3, "Sub-task content is too short"),
  description: z.string().optional().nullable(),
});

export const commentSchema = z.object({
  requestId: z.string().min(1),
  content: z.string().min(1, "Comment cannot be empty"),
});
