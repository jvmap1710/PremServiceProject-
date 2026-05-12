"use client";

import { Calendar, LayoutGrid, List, UserCheck, Search, AlertCircle, Clock, ChevronRight, User, Loader2 } from "lucide-react";
import Link from "next/link";
import { RequestForm } from "./RequestForm";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { useRouter, useSearchParams } from "next/navigation";

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
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Danh sách yêu cầu dịch vụ</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Quản lý và theo dõi tiến độ xử lý yêu cầu Premium</p>
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
              Việc của tôi
            </button>
            <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-white dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-indigo-900/30">
              <List className="w-3.5 h-3.5" />
              Danh sách
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
            { id: "ALL", label: "Tất cả" },
            { id: "TODO", label: "Cần làm" },
            { id: "IN_PROGRESS", label: "Đang làm" },
            { id: "DONE", label: "Hoàn thành" }
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
            placeholder="Tìm mã, tiêu đề, khách hàng..."
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
              Hiển thị {requests.length} trên tổng số {pagination.totalCount} yêu cầu
            </span>
          </div>
          {requests.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-[32px] p-16 text-center text-slate-400 italic font-medium border border-slate-100 dark:border-slate-800">
              {searchInput || mine ? "Không tìm thấy yêu cầu phù hợp với bộ lọc." : "Hiện tại chưa có yêu cầu nào được tạo."}
            </div>
          ) : (
            requests.map(req => (
            <div 
              key={req.id} 
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Code & Title */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <Link href={`/requests/${req.id}`} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4">
                      {req.code}
                    </Link>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {req.title || "Không có tiêu đề"}
                  </h3>
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
                        <span className="truncate">{new Date(req.deadline).toLocaleDateString("vi-VN")}</span>
                      </span>
                    </div>
                  ) : <div />}

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 w-full text-center">Khách hàng</span>
                    <span className="inline-flex justify-center items-center px-4 py-1 rounded-full text-[11px] font-bold bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30 w-full">
                      <span className="truncate max-w-[200px] md:max-w-full">{req.client.name}</span>
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 w-full text-center">Người xử lý</span>
                    {req.assignee ? (
                      <span className="inline-flex justify-center items-center px-4 py-1 rounded-full text-[11px] font-bold bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30 w-full">
                        <span className="truncate">{req.assignee.name}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-300 italic w-full text-center py-1">Chưa gán</span>
                    )}
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 w-full text-center">Trạng thái</span>
                    <span className={`flex justify-center px-4 py-1 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap w-full ${
                      req.status === "TODO" ? "bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-700" :
                      req.status === "IN_PROGRESS" ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/30" :
                      "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/30"
                    }`}>
                      {req.status === "TODO" ? "Cần làm" : (req.status === "IN_PROGRESS" ? "Đang xử lý" : "Hoàn thành")}
                    </span>
                  </div>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end md:pl-6 md:border-l border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <Link 
                      href={`/requests/${req.id}`}
                      className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-2xl transition-all"
                    >
                      <List className="w-5 h-5" />
                    </Link>
                    <RequestForm clients={clients} users={users} initialData={req} />
                  </div>
                </div>
              </div>
            </div>
          ))
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
