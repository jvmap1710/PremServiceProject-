"use client";

import { Calendar, LayoutGrid, List, UserCheck, Search, AlertCircle, Clock, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { RequestForm } from "./RequestForm";
import { useState } from "react";
import { cn } from "@/lib/utils";

export function RequestList({ 
  requests, 
  clients,
  currentUser,
  users = []
}: { 
  requests: any[], 
  clients: any[],
  currentUser?: any,
  users?: any[]
}) {
  const [filterMyTasks, setFilterMyTasks] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Reset page when filtering
  const [lastFilter, setLastFilter] = useState({ search: "", mine: false, status: "ALL" });
  if (lastFilter.search !== searchQuery || lastFilter.mine !== filterMyTasks || lastFilter.status !== filterStatus) {
    setLastFilter({ search: searchQuery, mine: filterMyTasks, status: filterStatus });
    setCurrentPage(1);
  }

  const filteredRequests = requests.filter(req => {
    // 1. Filter by search query
    const matchesSearch = 
      req.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.client.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // 2. Filter by "My Tasks"
    if (filterMyTasks && currentUser) {
      const isAssignee = req.assigneeId === currentUser.id;
      const isClientOwner = req.client.ownerId === currentUser.id;
      if (!isAssignee && !isClientOwner) return false;
    }

    // 3. Filter by Status
    if (filterStatus !== "ALL" && req.status !== filterStatus) return false;

    return true;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);
  const paginatedRequests = filteredRequests.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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
              onClick={() => setFilterMyTasks(!filterMyTasks)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterMyTasks 
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
              onClick={() => setFilterStatus(s.id)}
              className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                filterStatus === s.id 
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl py-2.5 pl-10 pr-4 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-600 transition-all shadow-sm"
          />
        </div>
      </div>

      <div className="space-y-4">
        {paginatedRequests.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[32px] p-16 text-center text-slate-400 italic font-medium border border-slate-100 dark:border-slate-800">
            {searchQuery || filterMyTasks ? "Không tìm thấy yêu cầu phù hợp với bộ lọc." : "Hiện tại chưa có yêu cầu nào được tạo."}
          </div>
        ) : (
          paginatedRequests.map(req => (
            <div 
              key={req.id} 
              className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 p-6 shadow-sm hover:shadow-xl hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-all group relative overflow-hidden"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                {/* Left: Code & Title */}
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/requests/${req.id}`} className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline underline-offset-4">
                      {req.code}
                    </Link>
                    <span className="w-1 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {new Date(req.raiseDate).toLocaleDateString("vi-VN")}
                    </span>
                    {req.creator && (
                      <>
                        <span className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-1" />
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/50 px-2 py-0.5 rounded-lg border border-slate-100 dark:border-slate-800">
                          <User className="w-3 h-3 text-indigo-500" />
                          Tạo bởi: {req.creator.name}
                        </span>
                      </>
                    )}
                    
                    {/* Priority Badge */}
                    <span className={cn(
                      "flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                      req.priority === "URGENT" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
                      req.priority === "HIGH" ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400" :
                      req.priority === "MEDIUM" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
                      "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                    )}>
                      {req.priority === "URGENT" && <AlertCircle className="w-3 h-3" />}
                      {req.priority || "MEDIUM"}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {req.title || "Không có tiêu đề"}
                  </h3>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {req.items.map((item: any) => (
                      <span key={item.id} className="bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-100 dark:border-slate-800">
                        {item.sroRule.taskName}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Middle: Client & Info */}
                <div className="flex flex-wrap items-center gap-6 md:gap-8">
                  {/* Deadline Indicator */}
                  {req.deadline && (
                    <div className="flex flex-col items-center md:items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Deadline</span>
                      <span className={cn(
                        "flex items-center gap-1.5 px-4 py-1 rounded-full text-[11px] font-bold border transition-all",
                        new Date(req.deadline) < new Date() && req.status !== "DONE"
                          ? "bg-rose-50 text-rose-600 border-rose-100 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-900/30"
                          : "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-900/50 dark:text-slate-400 dark:border-slate-800"
                      )}>
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(req.deadline).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  )}

                  <div className="flex flex-col items-center md:items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Khách hàng</span>
                    <span className="inline-flex items-center px-4 py-1 rounded-full text-[11px] font-bold bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-900/30">
                      {req.client.name}
                    </span>
                  </div>

                  <div className="flex flex-col items-center md:items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Người xử lý</span>
                    {req.assignee ? (
                      <span className="inline-flex items-center px-4 py-1 rounded-full text-[11px] font-bold bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-100/50 dark:border-emerald-900/30">
                        {req.assignee.name}
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-300 italic">Chưa gán</span>
                    )}
                  </div>

                  <div className="flex flex-col items-center md:items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Thời gian</span>
                    {(() => {
                      const actual = req.workLogs?.reduce((sum: number, log: any) => sum + log.hours, 0) || 0;
                      const budgeted = req.items.reduce((sum: number, item: any) => sum + item.sroRule.estimateHours * (item.quantity || 1), 0);
                      const isOver = actual > budgeted;
                      return (
                        <span className={`px-4 py-1 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap flex items-center gap-1.5 ${
                          isOver 
                            ? "bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/30 shadow-sm shadow-rose-100" 
                            : "bg-indigo-50/50 dark:bg-indigo-900/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800"
                        }`}>
                          <Calendar className="w-3 h-3" />
                          {actual.toFixed(2)}h / {budgeted.toFixed(2)}h
                        </span>
                      );
                    })()}
                  </div>

                  <div className="flex flex-col items-center md:items-end">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Trạng thái</span>
                    <span className={`px-4 py-1 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap ${
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

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-8">
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <Calendar className="w-5 h-5 rotate-90" />
          </button>
          
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            // Only show near current page
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <button
                  key={page}
                  onClick={() => handlePageChange(page)}
                  className={`w-10 h-10 rounded-xl text-xs font-black transition-all ${
                    currentPage === page
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                      : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}
                >
                  {page}
                </button>
              );
            }
            if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="text-slate-300">...</span>;
            }
            return null;
          })}

          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
          >
            <Calendar className="w-5 h-5 -rotate-90" />
          </button>
        </div>
      )}

    </div>
  );
}
