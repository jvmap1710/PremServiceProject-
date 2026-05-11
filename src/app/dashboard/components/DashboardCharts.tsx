"use client";

import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend } from "recharts";

const COLORS = ["#94a3b8", "#6366f1", "#22c55e", "#ef4444"];

export function DashboardCharts({ stats }: { stats: any }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="h-[400px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[32px]" />
        <div className="h-[400px] bg-slate-50 dark:bg-slate-900/50 animate-pulse rounded-[32px]" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Status Distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm h-[350px] md:h-[400px] flex flex-col">
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-6">Trạng thái Ticket</h3>
        <div className="flex-1 w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.statusCounts}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {stats.statusCounts.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Legend verticalAlign="bottom" height={36}/>
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Type Distribution */}
      <div className="bg-white dark:bg-slate-900 p-5 md:p-8 rounded-[24px] md:rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm h-[350px] md:h-[400px] flex flex-col">
        <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mb-6">Phân loại Yêu cầu</h3>
        <div className="flex-1 w-full min-h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.typeCounts}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 'bold', fill: '#64748b' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
              <Tooltip 
                cursor={{ fill: '#f8fafc' }}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar 
                dataKey="value" 
                radius={[8, 8, 0, 0]}
                barSize={40}
              >
                {stats.typeCounts.map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
