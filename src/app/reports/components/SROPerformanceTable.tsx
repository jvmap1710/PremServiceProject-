"use client";

import { useState } from "react";
import { User, Star, Trophy, Zap, ShieldCheck, Code, Layers, ChevronUp, ChevronDown } from "lucide-react";

interface SROPerformanceTableProps {
  data: any[];
}

export function SROPerformanceTable({ data }: SROPerformanceTableProps) {
  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'efficiency', direction: 'desc' });

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400 font-medium italic">Không có dữ liệu hiệu suất trong kỳ này.</p>
      </div>
    );
  }

  // Calculate top performers globally
  const maxTicketsCreated = Math.max(...data.map(s => s.ticketsCreated || 0), 1);
  const maxTicketsAssigned = Math.max(...data.map(s => s.ticketsAssigned || 0), 1);
  const maxEfficiency = Math.max(...data.map(s => s.efficiency));

  // Roles available
  const roles = ["ALL", "TAS", "IMP_ENGINEER"];

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <div className="w-3 h-3 opacity-20"><ChevronDown className="w-3 h-3" /></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />;
  };

  // Filter and Sort data
  const filteredData = (activeTab === "ALL" 
    ? data.filter(s => s.role !== "MANAGER")
    : activeTab === "TAS" 
    ? data.filter(s => s.role === "TAS" || s.role === "ADMIN")
    : data.filter(s => s.role === "IMP_ENGINEER" || s.role === "ADMIN")
  ).sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const renderStars = (rating: number) => {
    if (rating === 0) return <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest italic">N/A</span>;
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star 
            key={s} 
            className={`w-3 h-3 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-slate-200 dark:text-slate-700"}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Legend / Help Text */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 px-6 py-4 bg-slate-50 dark:bg-slate-900/40 rounded-[32px] border border-slate-100 dark:border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none">Hiệu suất {">"} 100%</span>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5 italic">Làm nhanh hơn dự kiến (Tốt)</span>
          </div>
        </div>
        <div className="hidden md:block w-px h-6 bg-slate-200 dark:bg-slate-800" />
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.5)]" />
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-slate-800 dark:text-slate-200 uppercase tracking-widest leading-none">Hiệu suất {"<"} 100%</span>
            <span className="text-[9px] font-bold text-slate-400 mt-0.5 italic">Làm lâu hơn dự kiến (Lố dự toán)</span>
          </div>
        </div>
        <div className="flex-1 text-right">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic leading-relaxed">
            * Bấm vào tiêu đề bảng để sắp xếp nhanh
          </p>
        </div>
      </div>

      {/* Role Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-1 p-1 bg-slate-50 dark:bg-slate-800/50 w-fit rounded-xl border border-slate-100 dark:border-slate-800">
          {roles.map(role => (
            <button
              key={role}
              onClick={() => setActiveTab(role)}
              className={`px-4 py-1.5 rounded-lg text-[10px] font-black transition-all flex items-center gap-2 ${
                activeTab === role 
                ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
                : "text-slate-400 hover:text-slate-600 uppercase"
              }`}
            >
              {role === "ALL" ? <Layers className="w-3 h-3" /> : role === "IMP_ENGINEER" ? <Code className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Performance Grid/Table */}
      <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-2">Nhân sự <SortIcon column="name" /></div>
                </th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('ticketsCreated')}>
                  <div className="flex items-center gap-2">Tạo (Tickets) <SortIcon column="ticketsCreated" /></div>
                </th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('ticketsAssigned')}>
                  <div className="flex items-center gap-2">Giao (Tickets) <SortIcon column="ticketsAssigned" /></div>
                </th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Dự toán (h)</th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Thực tế (h)</th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors text-center" onClick={() => requestSort('efficiency')}>
                  <div className="flex items-center justify-center gap-2">Hiệu suất (%) <SortIcon column="efficiency" /></div>
                </th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Đánh giá</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {filteredData.map((item, idx) => (
                <tr key={idx} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                        {item.role === "TAS" || item.role === "ADMIN" ? <Trophy className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-slate-100">{item.name}</span>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">{item.role}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-blue-600 dark:text-blue-400">{item.ticketsCreated}</span>
                      <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[40px]">
                        <div 
                          className="h-full bg-blue-500" 
                          style={{ width: `${(item.ticketsCreated / maxTicketsCreated) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300">{item.ticketsAssigned}</span>
                      <div className="flex-1 h-1 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden max-w-[40px]">
                        <div 
                          className="h-full bg-slate-400" 
                          style={{ width: `${(item.ticketsAssigned / maxTicketsAssigned) * 100}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-center text-sm font-bold text-slate-500">{item.estimate.toFixed(1)}h</td>
                  <td className="py-5 px-8 text-center text-sm font-bold text-slate-500">{item.actual.toFixed(1)}h</td>
                  <td className="py-5 px-8 text-center">
                    {item.actual > 0 ? (
                      <div className="inline-flex flex-col items-center">
                        <span className={`text-sm font-black ${item.efficiency >= 100 ? "text-emerald-500" : "text-rose-500"}`}>
                          {item.efficiency.toFixed(1)}%
                        </span>
                        <div className="w-16 h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1 overflow-hidden">
                          <div 
                            className={`h-full ${item.efficiency >= 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" : "bg-rose-500"}`} 
                            style={{ width: `${Math.min(100, item.efficiency)}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-xs font-bold text-slate-300 italic">-</span>
                    )}
                  </td>
                  <td className="py-5 px-8">
                    <div className="flex flex-col items-end gap-1">
                      {renderStars(item.rating)}
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Performance Score</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
