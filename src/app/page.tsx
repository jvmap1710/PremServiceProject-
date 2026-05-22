import { prisma } from "@/lib/prisma";
import { KanbanBoard } from "./requests/kanban/components/KanbanBoard";
import { LayoutGrid } from "lucide-react";
import { getDashboardStats } from "@/actions/dashboard";
import { DashboardStats } from "./dashboard/components/DashboardStats";
import { DashboardCharts } from "./dashboard/components/DashboardCharts";
import { getKanbanColumns } from "@/actions/kanban";
import { auth } from "@/auth";

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const [requests, clients, stats, columns, users, session] = await Promise.all([
    prisma.serviceRequest.findMany({
      include: {
        client: true,
        package: true,
        assignee: { select: { id: true, name: true, role: true } },
        creator: { select: { id: true, name: true, role: true } },
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
          orderBy: { createdAt: 'desc' }
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
    getDashboardStats(),
    getKanbanColumns(),
    prisma.user.findMany({
      where: { role: { in: ["ADMIN", "TAS", "IMP_ENGINEER"] } },
      select: { id: true, name: true, role: true }
    }),
    auth()
  ]);

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      {/* Header */}
      <div className="px-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
          <LayoutGrid className="w-8 h-8 text-blue-600" />
          Dashboard Overview
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Premium Service Management System - Performance Overview</p>
      </div>

      {/* Stats Cards */}
      <DashboardStats stats={stats} />

      {/* Charts Section */}
      <DashboardCharts stats={stats} />

      {/* Kanban Section */}
      <div className="space-y-2 pt-1">
        <div className="px-2 border-l-4 border-blue-600 pl-4">
          <h2 className="text-base font-black text-slate-900 dark:text-slate-100">Task Management</h2>
          <p className="text-slate-500 dark:text-slate-400 text-[9px] mt-0.5 uppercase tracking-widest font-bold">Current workflow management</p>
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
    </div>
  );
}