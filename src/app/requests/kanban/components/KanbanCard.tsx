"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Clock, User, Package, Tag, Briefcase, Rocket, AlertTriangle, 
  Calendar, ShieldAlert, UserCheck, Bug, Flame, ArrowDown, Minus
} from "lucide-react";
import { format, isPast, isToday, differenceInDays, startOfDay } from "date-fns";

const TYPE_ICONS: Record<string, any> = {
  TASK: { icon: Briefcase, color: "text-indigo-500", bg: "bg-indigo-50" },
  BUG:  { icon: Bug, color: "text-red-500", bg: "bg-red-50" },
  FEATURE: { icon: Rocket, color: "text-green-500", bg: "bg-green-50" },
  URGENT: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
};


const PRIORITY_CONFIG: Record<string, { icon: any, label_vi: string, label_en: string, textColor: string, bgColor: string, borderColor: string, darkText: string, darkBg: string, darkBorder: string }> = {
  LOW:    { icon: ArrowDown,    label_vi: "Thấp",     label_en: "Low",    textColor: "text-slate-500", bgColor: "bg-slate-100",    borderColor: "border-slate-200", darkText: "dark:text-slate-400",  darkBg: "dark:bg-slate-800",     darkBorder: "dark:border-slate-700" },
  MEDIUM: { icon: Minus,        label_vi: "Vừa",      label_en: "Medium", textColor: "text-indigo-600",  bgColor: "bg-indigo-50",      borderColor: "border-indigo-100",  darkText: "dark:text-indigo-400",   darkBg: "dark:bg-indigo-900/20",   darkBorder: "dark:border-indigo-900/30" },

  HIGH:   { icon: AlertTriangle,label_vi: "Cao",      label_en: "High",   textColor: "text-orange-600",bgColor: "bg-orange-50",    borderColor: "border-orange-200", darkText: "dark:text-orange-400", darkBg: "dark:bg-orange-900/20", darkBorder: "dark:border-orange-900/30" },
  URGENT: { icon: Flame,        label_vi: "Khẩn cấp", label_en: "Urgent", textColor: "text-red-600",   bgColor: "bg-red-50",       borderColor: "border-red-200",    darkText: "dark:text-red-400",    darkBg: "dark:bg-red-900/20",    darkBorder: "dark:border-red-900/30" },
};

export function KanbanCard({ 
  request,
  columnColor = "#94a3b8",
  onClick 
}: { 
  request: any,
  columnColor?: string,
  onClick?: () => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: request.id,
    data: { type: "Task", request }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    zIndex: isDragging ? 100 : 1,
  };

  const totalEstimatedHours = request.items.reduce((sum: number, item: any) => 
    sum + item.sroRule.estimateHours * (item.quantity || 1), 0);

  const totalActualHours = request.workLogs?.reduce((sum: number, log: any) => sum + log.hours, 0) || 0;
  const isOverBudget = totalEstimatedHours > 0 && totalActualHours > totalEstimatedHours;

  const deadlineDate = request.deadline ? new Date(request.deadline) : null;
  const todayStart   = startOfDay(new Date());
  const isOverdue    = deadlineDate && startOfDay(deadlineDate) < todayStart && request.status !== "DONE";
  const isDueToday   = deadlineDate && isToday(deadlineDate);
  const daysLeft     = deadlineDate ? differenceInDays(startOfDay(deadlineDate), todayStart) : null;

  const priority = PRIORITY_CONFIG[request.priority] || PRIORITY_CONFIG.MEDIUM;
  const PriorityIcon = priority.icon;

  // Deadline display state
  const deadlineBg    = isOverdue  ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800"
                      : isDueToday ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700";

  const deadlineText = isOverdue  ? `Quá hạn ${Math.abs(daysLeft!)}n`
                     : isDueToday ? "Hôm nay!"
                     : daysLeft !== null ? `Còn ${daysLeft}n`
                     : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative"
      {...attributes}
      {...listeners}
      onClick={() => { if (!isDragging) onClick?.(); }}
    >
      <div 
        className={`bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm hover:shadow-xl transition-all cursor-grab active:cursor-grabbing overflow-hidden ${isDragging ? 'ring-2 ring-indigo-500 shadow-2xl' : ''}`}


        style={{ 
          borderTopColor: isOverdue || isOverBudget ? (isOverBudget ? "#f43f5e" : "#fca5a5") : undefined,
          borderRightColor: isOverdue || isOverBudget ? (isOverBudget ? "#f43f5e" : "#fca5a5") : undefined,
          borderBottomColor: isOverdue || isOverBudget ? (isOverBudget ? "#f43f5e" : "#fca5a5") : undefined,
          borderLeftWidth: '8px',
          borderLeftColor: columnColor
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent dark:from-white/5 dark:to-transparent pointer-events-none" />
        {!isOverdue && <div className="absolute left-[8px] top-0 bottom-0 w-px bg-white/20 dark:bg-slate-800/20" />}
        {/* TOP PRIORITY BANNER — highly visible */}
        <div className={`flex items-center justify-between px-4 pt-3 pb-2 border-b transition-colors ${
          request.priority === 'URGENT' || isOverBudget ? 'border-rose-100 dark:border-rose-900/30' : 'border-slate-50 dark:border-slate-800'
        }`}>
          {/* Priority badge */}
          <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${priority.textColor} ${priority.darkText} ${priority.bgColor} ${priority.darkBg} ${priority.borderColor} ${priority.darkBorder}`}>
            <PriorityIcon className="w-2.5 h-2.5" />
            <span>{priority.label_vi}</span>
          </div>

          {/* Deadline badge */}
          {request.deadline ? (
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${deadlineBg} ${isOverdue ? 'animate-pulse' : ''}`}>
              <Calendar className="w-2.5 h-2.5" />
              <span>{format(new Date(request.deadline), 'dd/MM')}</span>
              {deadlineText && <span className="font-medium opacity-75">· {deadlineText}</span>}
            </div>
          ) : (
            <span className="text-[10px] text-slate-300 dark:text-slate-600 font-medium italic">Chưa có deadline</span>
          )}
        </div>

        {/* CARD BODY */}
        <div className="p-4 space-y-3">
          {/* Type + Code */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(() => {
                const typeInfo = TYPE_ICONS[request.type] || TYPE_ICONS.TASK;
                const Icon = typeInfo.icon;
                return (
                  <div className={`p-1.5 ${typeInfo.bg} dark:bg-slate-800 ${typeInfo.color} dark:text-slate-400 rounded-lg border border-white dark:border-slate-700 shadow-sm`}>
                    <Icon className="w-3 h-3" />
                  </div>
                );
              })()}
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{request.code}</span>
            </div>
            {isOverBudget && <span className="text-[8px] font-black bg-rose-500 text-white px-2 py-0.5 rounded-md uppercase tracking-widest animate-pulse shadow-sm shadow-rose-200">Exceeds SRO</span>}
          </div>

          {/* Title */}
          <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 tracking-tight">
            {request.title}
          </h4>



          {/* Client & Creator */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
              <User className="w-3 h-3" />
              <span className="text-[11px] font-bold truncate text-slate-500 dark:text-slate-400">{request.client.name}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-slate-300 dark:text-slate-600 pl-4">
              <span className="font-medium italic">Tạo bởi: {request.creator?.name || 'Hệ thống'}</span>
            </div>
          </div>

          {/* Footer: Assignee + Hours */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800 transition-colors">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-full border-2 border-white dark:border-slate-800 shadow overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800">
                {request.assignee ? (
                  <div className="w-full h-full flex items-center justify-center text-white font-black text-[10px]"
                    style={{ backgroundColor: columnColor }}>
                    {request.assignee.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <UserCheck className="w-3 h-3 text-slate-300 dark:text-slate-600" />
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate max-w-[100px]">
                {request.assignee?.name || 'Chưa giao'}
              </span>
            </div>

            <div className={`flex items-center gap-1.5 font-bold text-[11px] px-2 py-0.5 rounded-lg border transition-all ${
              isOverBudget 
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800 shadow-sm shadow-rose-100' 
                : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800'
            }`}>
              <Clock className="w-3 h-3" />
              <span>{totalActualHours.toFixed(1)}h / {totalEstimatedHours.toFixed(1)}h</span>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
