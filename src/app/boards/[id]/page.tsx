import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "../../requests/kanban/components/KanbanBoard";
import { notFound } from "next/navigation";
import { LayoutGrid, Bug, Briefcase } from "lucide-react";
import { getKanbanColumns } from "@/actions/kanban";

export default async function BoardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const board = await prisma.board.findUnique({
    where: { id }
  });

  if (!board) notFound();

  // Fetch requests based on board filter
  const requests = await prisma.serviceRequest.findMany({
    where: {
      type: (board.filterType && board.filterType !== "ALL") ? board.filterType : undefined,
      clientId: board.filterClient || undefined
    },
    include: {
      client: true,
      package: true,
      assignee: true,
      items: {
        include: {
          sroRule: true
        }
      },
      subTasks: {
        orderBy: { createdAt: 'asc' }
      },
      comments: {
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  });

  const [clients, columns, users] = await Promise.all([
    prisma.client.findMany({
      where: { isActive: true },
      include: {
        packages: {
          include: { sroRules: true }
        }
      }
    }),
    getKanbanColumns(),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "TAS", "IMP_ENGINEER"] } },
      select: { id: true, name: true, role: true }
    })
  ]);

  const Icon = board.filterType === "BUG" ? Bug : (board.filterType === "TASK" ? Briefcase : LayoutGrid);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="px-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <Icon className="w-8 h-8 text-blue-600" />
          {board.name}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Dedicated management board for {board.filterType || "all requests"}
        </p>
      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          initialRequests={requests} 
          clients={clients} 
          users={users} 
          initialColumns={columns} 
        />
      </div>
    </div>
  );
}
