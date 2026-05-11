"use client";

import { useEffect, useState } from "react";
import { getMyTasks } from "@/actions/request";
import Link from "next/link";
import { Clock, AlertCircle, CheckCircle2, Circle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export function SidebarTasks({ isCollapsed, onItemClick }: { isCollapsed: boolean, onItemClick?: () => void }) {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTasks() {
      const result = await getMyTasks();
      if (result.success && result.requests) {
        setTasks(result.requests);
      }
      setLoading(false);
    }
    loadTasks();
    const interval = setInterval(loadTasks, 300000); // 5 mins
    return () => clearInterval(interval);
  }, []);

  if (isCollapsed) return null;
  if (loading) return <div className="px-6 py-2 text-[10px] text-slate-400 animate-pulse uppercase font-black tracking-widest">Đang tải...</div>;
  if (tasks.length === 0) return <div className="px-6 py-4 text-[10px] text-slate-400 italic font-medium">Không có công việc nào</div>;

  return (
    <div className="px-3 space-y-1">
      {tasks.map(task => {
        const isUrgent = task.priority === "URGENT" || task.priority === "HIGH";
        const isOverdue = task.deadline && new Date(task.deadline) < new Date() && task.status !== "DONE";

        return (
          <Link 
            key={task.id}
            href={`/requests/${task.id}`}
            onClick={onItemClick}
            className="block p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 border border-transparent hover:border-slate-100 dark:hover:border-slate-800 transition-all group"
          >
            <div className="flex items-start gap-2">
              <div className={cn(
                "mt-0.5 shrink-0",
                task.status === "DONE" ? "text-emerald-500" : (task.status === "IN_PROGRESS" ? "text-blue-500" : "text-slate-300")
              )}>
                {task.status === "DONE" ? <CheckCircle2 className="w-3.5 h-3.5" /> : (task.status === "IN_PROGRESS" ? <Circle className="w-3.5 h-3.5 fill-blue-500/20" /> : <Circle className="w-3.5 h-3.5" />)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {task.title}
                  </p>
                  <span className={cn(
                    "text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0",
                    task.status === "TODO" ? "bg-slate-100 text-slate-400" : 
                    task.status === "IN_PROGRESS" ? "bg-blue-50 text-blue-500" : 
                    "bg-emerald-50 text-emerald-500"
                  )}>
                    {task.status === "TODO" ? "Cần làm" : (task.status === "IN_PROGRESS" ? "Đang xử lý" : "Xong")}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-[9px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 py-0.5 rounded uppercase tracking-tighter shrink-0">
                    {task.client.code}
                  </span>
                  {task.deadline && (
                    <span className={cn(
                      "flex items-center gap-1 text-[9px] font-bold",
                      isOverdue ? "text-rose-500" : "text-slate-400"
                    )}>
                      <Clock className="w-2.5 h-2.5" />
                      {format(new Date(task.deadline), "dd/MM")}
                    </span>
                  )}
                  {isUrgent && (
                    <AlertCircle className="w-3 h-3 text-orange-500 shrink-0" />
                  )}
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
