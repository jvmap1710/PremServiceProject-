import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "./components/KanbanBoard";
import { LayoutGrid, List, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { getKanbanColumns } from "@/actions/kanban";

// Force Next.js to always fetch fresh data from DB on every request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function KanbanPage() {
  const [requests, clients, columns, users, session] = await Promise.all([
    prisma.serviceRequest.findMany({
      include: {
        client: true,
        package: true,
        assignee: { select: { id: true, name: true, role: true } },
        creator: { select: { name: true } },
        items: {
          include: {
            sroRule: true
          }
        },
        workLogs: true,
        subTasks: {
          orderBy: { createdAt: 'asc' }
        },
        comments: {
          orderBy: { createdAt: 'desc' }
        },
        slaLines: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    }),
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
      where: {
        role: { in: ["ADMIN", "TAS", "IMP_ENGINEER"] }
      },
      select: { id: true, name: true, role: true },
      orderBy: { name: 'asc' }
    }),
    import("@/auth").then(m => m.auth())
  ]);

  console.log("KanbanPage requests count:", requests.length);
  console.log("KanbanPage requests slaLines count:", requests.map(r => ({ code: r.code, slaLines: r.slaLines?.length })));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 h-full flex flex-col">
      <div className="flex justify-between items-center px-2">
        <div className="space-y-1">
          <Link 
            href="/requests" 
            className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors font-medium text-xs group"
          >
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            Back to list
          </Link>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
            <LayoutGrid className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            Ticket Management Board
          </h1>

        </div>

        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
          <Link 
            href="/requests"
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-white dark:hover:bg-slate-900 transition-all"
          >
            <List className="w-4 h-4" />
            List View
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700">
            <LayoutGrid className="w-4 h-4" />
            Kanban Board
          </div>
        </div>

      </div>

      <div className="flex-1 overflow-hidden">
        <KanbanBoard 
          initialRequests={requests} 
          clients={clients} 
          users={users} 
          initialColumns={columns} 
          currentUser={session?.user as any}
        />
      </div>
    </div>
  );
}
