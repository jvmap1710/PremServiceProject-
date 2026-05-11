"use client";

import { TrendingUp, TrendingDown, Minus, Ticket, Clock, CheckCircle2 } from "lucide-react";

interface ComparisonCardsProps {
  data: any;
}

export function ComparisonCards({ data }: ComparisonCardsProps) {
  const { current, comparison } = data;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total Tickets */}
      <Card 
        title="Tổng số Ticket" 
        value={current.totalTickets} 
        icon={<Ticket className="w-6 h-6 text-blue-600" />}
        qoq={comparison.qoq.ticketsChange}
        yoy={comparison.yoy.ticketsChange}
      />

      {/* Actual Hours */}
      <Card 
        title="Giờ thực hiện (Act)" 
        value={`${current.totalActualHours.toFixed(1)}h`} 
        icon={<Clock className="w-6 h-6 text-emerald-600" />}
        qoq={comparison.qoq.hoursChange}
        yoy={comparison.yoy.hoursChange}
      />

      {/* Estimate Hours Comparison */}
      <Card 
        title="Dự toán (Est vs Act)" 
        value={`${current.totalEstimatedHours.toFixed(1)}h`} 
        icon={<TrendingUp className="w-6 h-6 text-amber-600" />}
        subtitle={`Sử dụng ${(current.totalActualHours / (current.totalEstimatedHours || 1) * 100).toFixed(1)}% quỹ giờ (${current.totalActualHours.toFixed(1)}h Act / ${current.totalEstimatedHours.toFixed(1)}h Est)`}
      />

      {/* SLA Compliance */}
      <Card 
        title="Tỷ lệ đạt SLA" 
        value={`${current.slaComplianceRate.toFixed(1)}%`} 
        icon={<CheckCircle2 className="w-6 h-6 text-indigo-600" />}
        subtitle={`Hoàn thành đúng hạn ${current.slaComplianceRate === 100 ? "tuyệt đối" : "ổn định"}`}
      />
    </div>
  );
}

function Card({ title, value, icon, qoq, yoy, subtitle }: any) {
  return (
    <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
      <div className="flex justify-between items-start">
        <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl">
          {icon}
        </div>
        <div className="space-y-1 text-right">
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{value}</p>
        </div>
      </div>

      {(qoq !== undefined || yoy !== undefined) ? (
        <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-4">
          {qoq !== undefined && <Badge label="vs Kỳ trước" value={qoq} />}
          {yoy !== undefined && <Badge label="vs Cùng kỳ" value={yoy} />}
        </div>
      ) : subtitle && (
        <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{subtitle}</p>
        </div>
      )}
    </div>
  );
}

function Badge({ label, value }: { label: string, value: number }) {
  const isPositive = value > 0;
  const isZero = value === 0;

  return (
    <div className="flex flex-col gap-1">
      <div className={`flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter ${
        isZero ? 'text-slate-400' : isPositive ? 'text-emerald-600' : 'text-rose-600'
      }`}>
        {isZero ? <Minus className="w-3 h-3" /> : isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        {isPositive ? '+' : ''}{value.toFixed(1)}%
      </div>
      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}
