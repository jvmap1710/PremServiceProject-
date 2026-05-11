"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle2, Minus, ChevronUp, ChevronDown } from "lucide-react";

export function SROUsageTable({ data }: { data: any[] }) {
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'count', direction: 'desc' });

  if (!data || data.length === 0) return null;

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

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    const aVal = a[sortConfig.key];
    const bVal = b[sortConfig.key];
    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <div className="space-y-4">
       <div className="flex justify-end px-6">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest italic">
            * Bấm vào tiêu đề bảng để sắp xếp nhanh
          </p>
        </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <th className="px-6 py-4 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('name')}>
                <div className="flex items-center gap-2">Tên nghiệp vụ SRO <SortIcon column="name" /></div>
              </th>
              <th className="px-6 py-4 text-center cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('count')}>
                <div className="flex items-center justify-center gap-2">Tần suất dùng <SortIcon column="count" /></div>
              </th>
              <th className="px-6 py-4 text-right cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('hours')}>
                <div className="flex items-center justify-end gap-2">Tổng giờ thực tế <SortIcon column="hours" /></div>
              </th>
              <th className="px-6 py-4 text-right">Định mức</th>
              <th className="px-6 py-4 text-center">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item, idx) => {
              const isUnused = item.count === 0;
              const isHeavy = item.count > 20;

              return (
                <tr key={idx} className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl group transition-all hover:scale-[1.01] hover:shadow-md">
                  <td className="px-6 py-5 rounded-l-2xl">
                    <p className="text-sm font-black text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{item.client}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${
                      isUnused ? "bg-slate-100 text-slate-400" : "bg-blue-50 text-blue-600"
                    }`}>
                      {item.count} lần
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right font-black text-slate-700 dark:text-slate-300">
                    {item.hours.toFixed(1)}h
                  </td>
                  <td className="px-6 py-5 text-right text-xs font-bold text-slate-400">
                    {item.estimate}h/item
                  </td>
                  <td className="px-6 py-5 text-center rounded-r-2xl">
                    {isUnused ? (
                      <div className="flex items-center justify-center gap-1 text-amber-500 bg-amber-50 px-3 py-1 rounded-full inline-flex">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase">Không dùng</span>
                      </div>
                    ) : isHeavy ? (
                      <div className="flex items-center justify-center gap-1 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full inline-flex">
                        <CheckCircle2 className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase">Dùng nhiều</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-1 text-blue-500 bg-blue-50 px-3 py-1 rounded-full inline-flex">
                        <Minus className="w-3 h-3" />
                        <span className="text-[10px] font-black uppercase">Bình thường</span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
