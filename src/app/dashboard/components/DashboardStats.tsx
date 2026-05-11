"use client";

import { FileText, Clock, Activity, CheckCircle2 } from "lucide-react";

export function DashboardStats({ stats }: { stats: any }) {
  const cards = [
    {
      title: "Tổng Ticket",
      value: stats.totalRequests,
      icon: FileText,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-50 dark:bg-blue-900/20",
      borderColor: "border-blue-100/50 dark:border-blue-900/30"
    },
    {
      title: "Tổng giờ SRO",
      value: `${stats.totalHours}h`,
      icon: Clock,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-50 dark:bg-purple-900/20",
      borderColor: "border-purple-100/50 dark:border-purple-900/30"
    },
    {
      title: "Đang xử lý",
      value: stats.inProgressRequests,
      icon: Activity,
      color: "text-orange-600 dark:text-orange-400",
      bg: "bg-orange-50 dark:bg-orange-900/20",
      borderColor: "border-orange-100/50 dark:border-orange-900/30"
    },
    {
      title: "Tỉ lệ hoàn thành",
      value: `${stats.completionRate}%`,
      icon: CheckCircle2,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-50 dark:bg-green-900/20",
      borderColor: "border-green-100/50 dark:border-green-900/30"
    }
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
      {cards.map((card, i) => (
        <div 
          key={i}
          className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{card.title}</p>
              <h3 className="text-xl md:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{card.value}</h3>
            </div>
            <div className={`w-10 h-10 md:w-14 md:h-14 ${card.bg} ${card.color} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform shrink-0 border ${card.borderColor}`}>
              <card.icon className="w-5 h-5 md:w-7 md:h-7" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
