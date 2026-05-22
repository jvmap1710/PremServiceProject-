"use client";

import { Calendar, LayoutGrid, List, UserCheck, Search, AlertCircle, Clock, ChevronRight, User, Loader2, ShieldAlert, AlertTriangle, Tag } from "lucide-react";
import Link from "next/link";
import { RequestForm } from "./RequestForm";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

const PRIORITY_STYLES: Record<string, { icon: any, label: string, color: string, bg: string, border: string, accent: string }> = {
  P1:      { icon: ShieldAlert,    label: "P1",      color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-900/30", accent: "#e11d48" },
  URGENT:  { icon: ShieldAlert,    label: "URGENT",  color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-900/30", accent: "#e11d48" },
  HIGHEST: { icon: ShieldAlert,    label: "HIGHEST", color: "text-red-600 dark:text-red-400", bg: "bg-red-50 dark:bg-red-900/20", border: "border-red-200 dark:border-red-900/30", accent: "#e11d48" },
  P2:      { icon: AlertTriangle,  label: "P2",      color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-900/30", accent: "#f97316" },
  HIGH:    { icon: AlertTriangle,  label: "HIGH",    color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-50 dark:bg-orange-900/20", border: "border-orange-200 dark:border-orange-900/30", accent: "#f97316" },
  P3:      { icon: Tag,            label: "P3",      color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-900/30", accent: "#3b82f6" },
  MEDIUM:  { icon: Tag,            label: "MEDIUM",  color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", border: "border-blue-200 dark:border-blue-900/30", accent: "#3b82f6" },
  P4:      { icon: Clock,          label: "P4",      color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-900/30", accent: "#94a3b8" },
  LOW:     { icon: Clock,          label: "LOW",      color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-900/30", accent: "#94a3b8" },
  LOWEST:  { icon: Clock,          label: "LOWEST",   color: "text-slate-500 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-900/30", accent: "#94a3b8" },
};

const TASK_PRIORITY_MAP: Record<string, { label: string, color: string, bg: string, border: string }> = {
  HIGHEST: { label: "Highest", color: "text-red-700 dark:text-red-300", bg: "bg-red-50/50 dark:bg-red-950/20", border: "border-red-200 dark:border-rose-800/30" },
  HIGH:    { label: "High",    color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50/50 dark:bg-orange-950/20", border: "border-orange-200 dark:border-amber-800/30" },
  MEDIUM:  { label: "Medium",  color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-amber-200 dark:border-amber-800/30" },
  LOW:     { label: "Low",     color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50/50 dark:bg-blue-950/20", border: "border-blue-200 dark:border-emerald-800/30" },
  LOWEST:  { label: "Lowest",  color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700" },
};

const SLA_PRIORITY_MAP: Record<string, { label: string, color: string, bg: string, border: string }> = {
  P1: { label: "SLA: P1", color: "text-red-700 dark:text-red-300", bg: "bg-red-50/80 dark:bg-red-950/30", border: "border-red-200 dark:border-red-900/30" },
  P2: { label: "SLA: P2", color: "text-orange-700 dark:text-orange-300", bg: "bg-orange-50/80 dark:bg-orange-950/30", border: "border-orange-200 dark:border-orange-900/30" },
  P3: { label: "SLA: P3", color: "text-blue-700 dark:text-blue-300", bg: "bg-blue-50/80 dark:bg-blue-950/30", border: "border-blue-200 dark:border-blue-900/30" },
  P4: { label: "SLA: P4", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-50 dark:bg-slate-900/20", border: "border-slate-200 dark:border-slate-900/30" },
};

const TICKET_TYPE_STYLES: Record<string, { label: string, color: string, bg: string, border: string }> = {
  INCIDENT: { label: "Incident", color: "text-rose-700 dark:text-rose-300", bg: "bg-rose-50/50 dark:bg-rose-950/20", border: "border-rose-100 dark:border-rose-800/30" },
  PROBLEM: { label: "Problem", color: "text-amber-700 dark:text-amber-300", bg: "bg-amber-50/50 dark:bg-amber-950/20", border: "border-amber-100 dark:border-amber-800/30" },
  SRO: { label: "SRO", color: "text-indigo-700 dark:text-indigo-300", bg: "bg-indigo-50/50 dark:bg-indigo-950/20", border: "border-indigo-100 dark:border-indigo-800/30" },
  NSRO: { label: "NSRO", color: "text-violet-700 dark:text-violet-300", bg: "bg-violet-50/50 dark:bg-violet-950/20", border: "border-violet-100 dark:border-violet-800/30" },
  HEALTH_CHECK: { label: "Health Check", color: "text-teal-700 dark:text-teal-300", bg: "bg-teal-50/50 dark:bg-teal-950/20", border: "border-teal-100 dark:border-teal-800/30" },
  OTHERS: { label: "Others", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800/50", border: "border-slate-200 dark:border-slate-700" },
};

export function RequestList({ 
  requests, 
  clients,
  currentUser,
  users = [],
  pagination
}: { 
  requests: any[], 
  clients: any[],
  currentUser?: any,
  users?: any[],
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
  }
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);
  
  // Local state only for input values to keep them responsive
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const mine = searchParams.get("mine") === "true";
  const status = searchParams.get("status") || "ALL";

  // Sync local search input with URL when navigating back/forward
  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
    // Turn off loading state when URL finishes changing
    setIsPending(false);
  }, [searchParams]);

  const updateFilters = useCallback((updates: Record<string, string | boolean | null>) => {
    setIsPending(true);
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "" || value === false || value === "ALL") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });

    // Reset to page 1 when filters change (unless page is specifically updated)
    if (!updates.hasOwnProperty("page")) {
      params.set("page", "1");
    }

    router.push(`/requests?${params.toString()}`);
  }, [router, searchParams]);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== (searchParams.get("search") || "")) {
        updateFilters({ search: searchInput });
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput, updateFilters, searchParams]);

  const handleToggleMyTasks = () => {
    updateFilters({ mine: !mine });
  };

  const handleStatusChange = (newStatus: string) => {
    updateFilters({ status: newStatus });
  };

  const handlePageChange = (page: number) => {
    updateFilters({ page: String(page) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Service Request List</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Manage and track Premium request processing progress</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-inner">
            <button 
              onClick={handleToggleMyTasks}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                mine 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" 
                : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              My Tasks
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-indigo-900/30">
              <List className="w-3.5 h-3.5" />
              List
            </div>
            <Link 
              href="/requests/kanban"
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700 transition-all"
            >
              <LayoutGrid className="w-4 h-4" />
              Kanban
            </Link>
          </div>
          <RequestForm clients={clients} users={users} />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Status Filters */}
        <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800/50 p-1 rounded-2xl border border-slate-100 dark:border-slate-800">
          {[
            { id: "ALL", label: "All" },
            { id: "TODO", label: "Received" },
            { id: "IN_PROGRESS", label: "In Progress" },
            { id: "DONE", label: "Completed" },
            { id: "PAUSED", label: "On Hold" },
            { id: "CLOSED", label: "Closed" }
          ].map(s => (
            <button
              key={s.id}
              onClick={() => handleStatusChange(s.id)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                status === s.id 
                ? "bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-100 dark:border-slate-600" 
                : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative group flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text"
            placeholder="Search by code, title, client..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="relative">
        <div className={cn(
          "space-y-4 transition-opacity duration-200",
          isPending && "opacity-40 pointer-events-none"
        )}>
          <div className="flex items-center justify-between px-6 py-2">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              Showing {requests.length} of {pagination.totalCount} requests
            </span>
          </div>
          {requests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-16 text-center text-slate-400 italic font-medium border border-slate-100 dark:border-slate-800">
              {searchInput || mine ? "No matching requests found." : "No requests created yet."}
            </div>
          ) : (
            requests.map(req => {
              const priorityStyle = PRIORITY_STYLES[req.priority] || PRIORITY_STYLES["P4"];
              const isOverdue = req.deadline && new Date(req.deadline) < new Date() && req.status !== "DONE";
              const borderColor = isOverdue ? "#f43f5e" : priorityStyle.accent;

              return (
              <div 
                key={req.id} 
                className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group relative overflow-hidden"
                style={{
                  borderLeftWidth: '6px',
                  borderLeftColor: borderColor
                }}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Left: Code & Title */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <Link href={`/requests/${req.id}`} className="text-sm font-black text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4">
                        {req.code}
                      </Link>
                      
                      {/* 1. Combined Ticket Type & Ticket Priority Badge */}
                      {(() => {
                        const typeLabel = TICKET_TYPE_STYLES[req.type]?.label || req.type;
                        const isIncidentOrProblem = req.type === "INCIDENT" || req.type === "PROBLEM";
                        const slaPrio = req.priority || "P4";
                        
                        const badgeText = isIncidentOrProblem 
                          ? `${typeLabel} - ${slaPrio}` 
                          : `${typeLabel} - ${(TASK_PRIORITY_MAP[req.taskPriority || "MEDIUM"] || TASK_PRIORITY_MAP["MEDIUM"]).label}`;
                        return (
                          <div className={`px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${TICKET_TYPE_STYLES[req.type]?.color || 'text-slate-600'} ${TICKET_TYPE_STYLES[req.type]?.bg || 'bg-slate-50'} ${TICKET_TYPE_STYLES[req.type]?.border || 'border-slate-200'}`}>
                            {badgeText}
                          </div>
                        );
                      })()}

                      {/* 2. SLA Priority Badge */}
                      {(() => {
                        const isIncidentOrProblem = req.type === "INCIDENT" || req.type === "PROBLEM";
                        if (isIncidentOrProblem) return null;

                        const slaPrio = req.priority || "P4";
                        const slaStyle = SLA_PRIORITY_MAP[slaPrio] || SLA_PRIORITY_MAP["P4"];
                        const SlaIcon = PRIORITY_STYLES[slaPrio]?.icon || Clock;
                        return (
                          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wider ${slaStyle.color} ${slaStyle.bg} ${slaStyle.border}`}>
                            <SlaIcon className="w-2.5 h-2.5 animate-pulse" />
                            <span>{slaStyle.label}</span>
                          </div>
                        );
                      })()}
                    </div>
                  <Link href={`/requests/${req.id}`} className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {req.title || "No Title"}
                  </Link>
                </div>

                {/* Middle: Client & Info */}
                <div className="flex flex-wrap md:grid md:grid-cols-[120px_minmax(200px,1fr)_140px_120px] items-center gap-4 md:gap-6 w-full md:flex-1">
                  {/* Deadline Indicator */}
                  {req.deadline ? (
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 w-full text-center">Deadline</span>
                      <span className={cn(
                        "flex items-center justify-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold border transition-all w-full",
                        new Date(req.deadline) < new Date() && req.status !== "DONE"
                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30"
                          : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800"
                      )}>
                        <Clock className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{new Date(req.deadline).toLocaleDateString("en-US")}</span>
                      </span>
                    </div>
                  ) : <div />}

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 w-full text-center">Client</span>
                    <span className="inline-flex justify-center items-center px-4 py-1 rounded-full text-[11px] font-bold bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 w-full">
                      <span className="truncate max-w-[200px] md:max-w-full">{req.client.name}</span>
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 w-full text-center">Assignee</span>
                    {(() => {
                      const ids = (req.assigneeIds || "").split(",").map((id: string) => id.trim()).filter(Boolean);
                      if (ids.length === 0) {
                        if (req.assignee) {
                          return (
                            <span className="inline-flex justify-center items-center px-4 py-1 rounded-full text-[11px] font-bold bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 w-full">
                              <span className="truncate">{req.assignee.name}</span>
                            </span>
                          );
                        }
                        return <span className="text-[11px] text-slate-300 italic w-full text-center py-1">Unassigned</span>;
                      }

                      const assignedNames = ids.map((id: string) => {
                        const found = users?.find((u: any) => u.id === id);
                        if (found) return found.name;
                        if (req.assignee && req.assignee.id === id) return req.assignee.name;
                        return id;
                      });

                      return (
                        <span className="inline-flex justify-center items-center px-4 py-1 rounded-full text-[11px] font-bold bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 w-full" title={assignedNames.join(", ")}>
                          <span className="truncate">{assignedNames.join(", ")}</span>
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 w-full text-center">Status</span>
                    <span className={`flex justify-center px-4 py-1 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap w-full ${
                      req.status === "TODO" ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700" :
                      req.status === "IN_PROGRESS" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" :
                      req.status === "DONE" ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30" :
                      req.status === "PAUSED" ? "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/30" :
                      "bg-zinc-50 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-100 dark:border-zinc-700"
                    }`}>
                      {req.status === "TODO" ? "Received" : (req.status === "IN_PROGRESS" ? "In Progress" : (req.status === "DONE" ? "Completed" : (req.status === "PAUSED" ? "On Hold" : "Closed")))}
                    </span>
                  </div>
                </div>


              </div>
            </div>
            );
          })
        )}
      </div>

      {isPending && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-white/80 dark:bg-slate-900/80 p-4 rounded-2xl shadow-xl backdrop-blur-sm border border-slate-100 dark:border-slate-800">
            <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          </div>
        </div>
      )}
    </div>

      {/* Pagination Controls */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => handlePageChange(pagination.currentPage - 1)}
            disabled={pagination.currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <Calendar className="w-5 h-5 rotate-90" />
          </button>
          
          {[...Array(pagination.totalPages)].map((_, i) => {
            const page = i + 1;
            // Only show near current page
            if (page === 1 || page === pagination.totalPages || (page >= pagination.currentPage - 1 && page <= pagination.currentPage + 1)) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    pagination.currentPage === page
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {page}
                </button>
              );
            }
            if (page === pagination.currentPage - 2 || page === pagination.currentPage + 2) {
              return <span key={page} className="text-slate-300">...</span>;
            }
            return null;
          })}

          <button
            onClick={() => handlePageChange(pagination.currentPage + 1)}
            disabled={pagination.currentPage === pagination.totalPages}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <Calendar className="w-5 h-5 -rotate-90" />
          </button>
        </div>
      )}

    </div>
  );
}
