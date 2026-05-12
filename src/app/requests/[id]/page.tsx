import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { RequestDetailView } from "./RequestDetailView";

export default async function RequestDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const request = await prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      client: true,
      package: true,
      assignee: { select: { id: true, name: true, role: true } },
      creator: { select: { id: true, name: true, role: true } },
      comments: {
        orderBy: { createdAt: 'desc' }
      },
      items: {
        include: {
          sroRule: true
        }
      },
      subTasks: {
        orderBy: { createdAt: 'asc' }
      },
      workLogs: {
        include: { 
          user: { select: { name: true } },
          serviceRequestItem: { include: { sroRule: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      attachments: {
        include: {
          user: { select: { name: true } }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!request) {
    notFound();
  }

  // Lấy dữ liệu để truyền vào RequestForm (Edit mode)
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    include: {
      packages: {
        include: { sroRules: true }
      }
    }
  });

  // Lấy TOÀN BỘ danh sách user để đảm bảo không bị sót role nào
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "TAS", "IMP_ENGINEER"] }
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' }
  });

  // Lấy danh sách cột Kanban để hiển thị status
  const kanbanColumns = await prisma.kanbanColumn.findMany({
    orderBy: { order: 'asc' }
  });

  return <RequestDetailView request={request} clients={clients} users={users} kanbanColumns={kanbanColumns} />;
}
