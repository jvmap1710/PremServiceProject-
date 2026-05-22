"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { 
  Clock, User, Package, Tag, Briefcase, Rocket, AlertTriangle, 
  Calendar, ShieldAlert, UserCheck, Bug, Flame, ArrowDown, Minus
} from "lucide-react";
import { format, isPast, isToday, differenceInDays, startOfDay } from "date-fns";

const TYPE_ICONS: Record<string, any> = {
  INCIDENT:     { icon: AlertTriangle, color: "text-rose-500",    bg: "bg-rose-50 dark:bg-rose-950/20" },
  PROBLEM:      { icon: Bug,           color: "text-amber-500",   bg: "bg-amber-50 dark:bg-amber-950/20" },
  SRO:          { icon: Briefcase,     color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/20" },
  NSRO:         { icon: Rocket,        color: "text-violet-500",  bg: "bg-violet-50 dark:bg-violet-950/20" },
  HEALTH_CHECK: { icon: Clock,         color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/20" },
  OTHERS:       { icon: Tag,           color: "text-slate-500",   bg: "bg-slate-50 dark:bg-slate-950/20" },
  
  // Legacy safety mappings
  TASK:    { icon: Briefcase,     color: "text-indigo-500",  bg: "bg-indigo-50 dark:bg-indigo-950/20" },
  BUG:     { icon: Bug,           color: "text-red-500",     bg: "bg-red-50 dark:bg-red-950/20" },
  FEATURE: { icon: Rocket,        color: "text-green-500",   bg: "bg-green-50 dark:bg-green-950/20" },
  URGENT:  { icon: AlertTriangle, color: "text-orange-500",  bg: "bg-orange-50 dark:bg-orange-950/20" },
};


const PRIORITY_CONFIG: Record<string, { icon: any, label_vi: string, label_en: string, textColor: string, bgColor: string, borderColor: string, darkText: string, darkBg: string, darkBorder: string }> = {
  P1:      { icon: Flame,         label_vi: "P1", label_en: "P1", textColor: "text-red-600",    bgColor: "bg-red-50",        borderColor: "border-red-200",    darkText: "dark:text-red-400",    darkBg: "dark:bg-red-900/20",    darkBorder: "dark:border-red-900/30" },
  URGENT:  { icon: Flame,         label_vi: "URGENT", label_en: "URGENT", textColor: "text-red-600",    bgColor: "bg-red-50",        borderColor: "border-red-200",    darkText: "dark:text-red-400",    darkBg: "dark:bg-red-900/20",    darkBorder: "dark:border-red-900/30" },
  P2:      { icon: AlertTriangle, label_vi: "P2", label_en: "P2", textColor: "text-orange-600", bgColor: "bg-orange-50",     borderColor: "border-orange-200", darkText: "dark:text-orange-400", darkBg: "dark:bg-orange-900/20", darkBorder: "dark:border-orange-900/30" },
  HIGHEST: { icon: Flame,         label_vi: "Highest", label_en: "Highest", textColor: "text-red-600",    bgColor: "bg-red-50",        borderColor: "border-red-200",    darkText: "dark:text-red-400",    darkBg: "dark:bg-red-900/20",    darkBorder: "dark:border-red-900/30" },
  HIGH:    { icon: AlertTriangle, label_vi: "High",    label_en: "High",    textColor: "text-orange-600", bgColor: "bg-orange-50",     borderColor: "border-orange-200", darkText: "dark:text-orange-400", darkBg: "dark:bg-orange-900/20", darkBorder: "dark:border-orange-900/30" },
  P3:      { icon: Tag,           label_vi: "P3", label_en: "P3", textColor: "text-blue-600",   bgColor: "bg-blue-50",       borderColor: "border-blue-200",   darkText: "dark:text-blue-400",   darkBg: "dark:bg-blue-900/20",   darkBorder: "dark:border-blue-900/30" },
  MEDIUM:  { icon: Tag,           label_vi: "Medium",  label_en: "Medium",  textColor: "text-amber-600",  bgColor: "bg-amber-50",      borderColor: "border-amber-200",  darkText: "dark:text-amber-400",  darkBg: "dark:bg-amber-900/20",  darkBorder: "dark:border-amber-900/30" },
  P4:      { icon: Clock,         label_vi: "P4", label_en: "P4", textColor: "text-slate-600",   bgColor: "bg-slate-50",       borderColor: "border-slate-200",   darkText: "dark:text-slate-400",   darkBg: "dark:bg-slate-900/20",   darkBorder: "dark:border-slate-900/30" },
  LOW:     { icon: Clock,         label_vi: "Low",     label_en: "Low",     textColor: "text-blue-600",   bgColor: "bg-blue-50",       borderColor: "border-blue-200",   darkText: "dark:text-blue-400",   darkBg: "dark:bg-blue-900/20",   darkBorder: "dark:border-blue-900/30" },
  LOWEST:  { icon: Clock,         label_vi: "Lowest",  label_en: "Lowest",  textColor: "text-slate-500",  bgColor: "bg-slate-50",      borderColor: "border-slate-200",  darkText: "dark:text-slate-400",  darkBg: "dark:bg-slate-900/20",  darkBorder: "dark:border-slate-900/30" },
};

const URGENCY_CONFIG: Record<string, { label: string, color: string, bg: string, border: string }> = {
  IMMEDIATE: { label: "IMMEDIATE", color: "text-red-600 dark:text-red-400", bg: "bg-red-50/50 dark:bg-red-950/20", border: "border-red-100/50 dark:border-red-900/20" },
  URGENT:    { label: "URGENT",    color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-amber-100/50 dark:border-amber-900/20" },
  MODERATE:  { label: "MODERATE",  color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50/50 dark:bg-blue-950/20", border: "border-blue-100/50 dark:border-blue-900/20" },
  STANDARD:  { label: "STANDARD",  color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50/50 dark:bg-slate-950/20", border: "border-slate-100/50 dark:border-slate-900/20" },
};

const IMPACT_CONFIG: Record<string, { label: string, color: string, bg: string, border: string }> = {
  WIDESPREAD: { label: "WIDESPREAD", color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-50/50 dark:bg-purple-950/20", border: "border-purple-100/50 dark:border-purple-900/20" },
  LARGE:      { label: "LARGE",      color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-50/50 dark:bg-indigo-950/20", border: "border-indigo-100/50 dark:border-indigo-900/20" },
  LIMITED:    { label: "LIMITED",    color: "text-teal-600 dark:text-teal-400", bg: "bg-teal-50/50 dark:bg-teal-950/20", border: "border-teal-100/50 dark:border-teal-900/20" },
  LOCALISED:  { label: "LOCALISED",  color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50/50 dark:bg-emerald-950/20", border: "border-emerald-100/50 dark:border-emerald-900/20" },
};

const TICKET_TYPE_STYLES: Record<string, { label: string, color: string, bg: string, border: string }> = {
  INCIDENT: { label: "Incident", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50/50 dark:bg-rose-950/20", border: "border-rose-100 dark:border-rose-800/30" },
  PROBLEM: { label: "Problem", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-amber-100 dark:border-amber-800/30" },
  SRO: { label: "SRO", color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50/50 dark:bg-indigo-950/20", border: "border-indigo-100 dark:border-indigo-800/30" },
  NSRO: { label: "NSRO", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50/50 dark:bg-violet-950/20", border: "border-violet-100 dark:border-violet-800/30" },
  HEALTH_CHECK: { label: "Health Check", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50/50 dark:bg-teal-950/20", border: "border-teal-100 dark:border-teal-800/30" },
  OTHERS: { label: "Others", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700" },
};

const SLA_PRIORITY_MAP: Record<string, { label: string, color: string, bg: string, border: string }> = {
  P1: { label: "SLA: P1", color: "text-red-700 dark:text-red-300", bg: "bg-red-50/80 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900/30" },
  P2: { label: "SLA: P2", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50/80 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-900/30" },
  P3: { label: "SLA: P3", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50/80 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/30" },
  P4: { label: "SLA: P4", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-900/30" },
};

const TASK_PRIORITY_MAP: Record<string, { label: string, color: string, bg: string, border: string }> = {
  HIGHEST: { label: "Highest", color: "text-red-700 dark:text-red-300", bg: "bg-red-50/50 dark:bg-red-950/20", border: "border-red-200 dark:border-red-800/30" },
  HIGH: { label: "High", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50/50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-orange-800/30" },
  MEDIUM: { label: "Medium", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/30" },
  LOW: { label: "Low", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50/50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-blue-800/30" },
  LOWEST: { label: "Lowest", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700" },
};

const normalizeSlaPriority = (priority: string): string => {
  const p = (priority || "").toUpperCase();
  if (["P1", "P2", "P3", "P4"].includes(p)) return p;
  if (["HIGHEST", "URGENT"].includes(p)) return "P1";
  if (["HIGH"].includes(p)) return "P2";
  if (["MEDIUM"].includes(p)) return "P3";
  if (["LOW", "LOWEST"].includes(p)) return "P4";
  return "P4";
};

export function KanbanCard({ 
  request,
  columnColor = "#94a3b8",
  onClick,
  users = []
}: { 
  request: any,
  columnColor?: string,
  onClick?: () => void,
  users?: any[]
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

  const ids = (request.assigneeIds || "").split(",").map((id: string) => id.trim()).filter(Boolean);
  const assignedUsers = ids.map((id: string) => {
    const found = users?.find((u: any) => u.id === id);
    if (found) return found;
    if (request.assignee && request.assignee.id === id) return request.assignee;
    return { id, name: id };
  });
  if (assignedUsers.length === 0 && request.assignee) {
    assignedUsers.push(request.assignee);
  }

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

  const deadlineText = isOverdue  ? `Overdue ${Math.abs(daysLeft!)}d`
                     : isDueToday ? "Today!"
                     : daysLeft !== null ? `${daysLeft}d left`
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
        <div className="flex items-center justify-between px-3 pt-3 pb-1.5 transition-colors">
          {/* Dual priority and Type badges */}
          <div className="flex flex-wrap items-center gap-1 flex-1 min-w-0 pr-2">
            {/* 1. Combined Ticket Type & Ticket Priority Badge */}
            {(() => {
              const typeLabel = TICKET_TYPE_STYLES[request.type]?.label || request.type;
              const isIncidentOrProblem = request.type === "INCIDENT" || request.type === "PROBLEM";
              const slaPrio = normalizeSlaPriority(request.priority);
              
              const badgeText = isIncidentOrProblem 
                ? `${typeLabel} - ${slaPrio}` 
                : `${typeLabel} - ${(TASK_PRIORITY_MAP[request.taskPriority || "MEDIUM"] || TASK_PRIORITY_MAP["MEDIUM"]).label}`;
              return (
                <div className={`px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider shrink-0 ${TICKET_TYPE_STYLES[request.type]?.color || 'text-slate-600'} ${TICKET_TYPE_STYLES[request.type]?.bg || 'bg-slate-50'} ${TICKET_TYPE_STYLES[request.type]?.border || 'border-slate-200'}`}>
                  {badgeText}
                </div>
              );
            })()}
          </div>

          {/* Deadline badge */}
          {request.deadline ? (
            <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full border text-[9px] font-semibold shrink-0 ${deadlineBg} ${isOverdue ? 'animate-pulse' : ''} mt-0.5`}>
              <Calendar className="w-2 h-2" />
              <span>{format(new Date(request.deadline), 'dd/MM')}</span>
              {deadlineText && <span className="font-medium opacity-75">· {deadlineText}</span>}
            </div>
          ) : null}
        </div>

        {/* CARD BODY */}
        <div className="px-3 pb-3 pt-1 space-y-2">
          {/* Type + Code */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              {(() => {
                const typeInfo = TYPE_ICONS[request.type] || TYPE_ICONS.TASK;
                const Icon = typeInfo.icon;
                return (
                  <div className={`p-1 ${typeInfo.bg} dark:bg-slate-800 ${typeInfo.color} dark:text-slate-400 rounded-md border border-white dark:border-slate-700`}>
                    <Icon className="w-2.5 h-2.5" />
                  </div>
                );
              })()}
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{request.code}</span>
            </div>
            
            {/* SLA Priority Badge replacing SRO! */}
            {(() => {
              const slaPrio = normalizeSlaPriority(request.priority);
              const slaStyle = SLA_PRIORITY_MAP[slaPrio] || SLA_PRIORITY_MAP["P4"];
              const SlaIcon = PRIORITY_CONFIG[slaPrio]?.icon || Clock;
              return (
                <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[8px] font-black uppercase tracking-wider shrink-0 ${slaStyle.color} ${slaStyle.bg} ${slaStyle.border}`}>
                  <SlaIcon className="w-2 h-2" />
                  <span>{slaStyle.label}</span>
                </div>
              );
            })()}
          </div>

          {/* Title */}
          <h4 className="text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-snug group-hover:text-indigo-700 dark:group-hover:text-indigo-400 transition-colors line-clamp-2 tracking-tight">
            {request.title}
          </h4>

          {/* Client */}
          <div className="flex items-center gap-1.5 text-slate-400 dark:text-slate-500">
            <User className="w-2.5 h-2.5 shrink-0" />
            <span className="text-[10px] font-semibold truncate text-slate-500 dark:text-slate-400">{request.client.name}</span>
          </div>

          {/* Urgency & Impact Badges */}
          {(request.urgency || request.impact) && request.type !== "INCIDENT" && request.type !== "PROBLEM" && (
            <div className="flex flex-wrap gap-1">
              {request.urgency && URGENCY_CONFIG[request.urgency] && (() => {
                const cfg = URGENCY_CONFIG[request.urgency];
                return (
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    <Clock className="w-2 h-2 animate-pulse" /> {cfg.label}
                  </span>
                );
              })()}
              {request.impact && IMPACT_CONFIG[request.impact] && (() => {
                const cfg = IMPACT_CONFIG[request.impact];
                return (
                  <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                    <ShieldAlert className="w-2 h-2" /> {cfg.label}
                  </span>
                );
              })()}
            </div>
          )}

          {/* Footer: Assignee + Hours */}
          <div className="flex items-start justify-between pt-1.5 transition-colors">
            <div className="flex items-start gap-1.5 max-w-[60%] min-w-0">
              {assignedUsers.length > 0 ? (
                <div className="flex -space-x-1.5 overflow-hidden shrink-0 mt-0.5">
                  {assignedUsers.slice(0, 3).map((u: any, idx: number) => {
                    const initial = u.name ? u.name.charAt(0).toUpperCase() : "?";
                    return (
                      <div
                        key={u.id || idx}
                        title={u.name}
                        className="w-5 h-5 rounded-full border border-white dark:border-slate-900 shadow-sm flex items-center justify-center text-white font-black text-[9px] shrink-0"
                        style={{ backgroundColor: columnColor }}
                      >
                        {initial}
                      </div>
                    );
                  })}
                  {assignedUsers.length > 3 && (
                    <div className="w-5 h-5 rounded-full border border-white dark:border-slate-900 shadow-sm flex items-center justify-center bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-black text-[8px] shrink-0 z-10">
                      +{assignedUsers.length - 3}
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-5 h-5 rounded-full border border-white dark:border-slate-800 shadow-sm overflow-hidden flex items-center justify-center bg-slate-100 dark:bg-slate-800 shrink-0 mt-0.5">
                  <UserCheck className="w-2.5 h-2.5 text-slate-300 dark:text-slate-600" />
                </div>
              )}
              <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 whitespace-normal break-words flex-1" title={assignedUsers.map((u: any) => u.name).join(", ")}>
                {assignedUsers.length > 0 ? assignedUsers.map((u: any) => u.name).join(", ") : 'Unassigned'}
              </span>
            </div>

            <div className={`flex items-center gap-1 font-bold text-[9px] px-1.5 py-0.5 rounded border transition-all ${
              isOverBudget 
                ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-800' 
                : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-800'
            }`}>
              <Clock className="w-2.5 h-2.5" />
              <span>{totalActualHours.toFixed(1)}h / {totalEstimatedHours.toFixed(1)}h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
