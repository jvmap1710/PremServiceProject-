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

  // Fetch data to pass into RequestForm (Edit mode)
  const clients = await prisma.client.findMany({
    where: { isActive: true },
    include: {
      packages: {
        include: { sroRules: true }
      }
    }
  });

  // Fetch ENTIRE user list to ensure no role is missed
  const users = await prisma.user.findMany({
    where: {
      role: { in: ["ADMIN", "TAS", "IMP_ENGINEER"] }
    },
    select: { id: true, name: true, role: true },
    orderBy: { name: 'asc' }
  });

  // Fetch Kanban columns to display status
  const kanbanColumns = await prisma.kanbanColumn.findMany({
    orderBy: { order: 'asc' }
  });

  return <RequestDetailView request={request} clients={clients} users={users} kanbanColumns={kanbanColumns} />;
}
