"use client";

import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragStartEvent, 
  DragOverEvent, 
  DragEndEvent,
  closestCorners,
  defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { useState, useMemo, useRef, useEffect } from "react";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { updateRequestStatus } from "@/actions/request";
import { Modal } from "@/components/ui/Modal";
import { RequestDetailView } from "../../[id]/RequestDetailView";
import { RequestForm } from "../../RequestForm";
import { toast } from "react-hot-toast";
import { 
  Search, Filter, Plus, User, Package as PackageIcon, Trash2, 
  Palette, Edit3, Check, X as CloseIcon, UserCheck 
} from "lucide-react";
import { 
  getKanbanColumns, createKanbanColumn, deleteKanbanColumn, 
  updateKanbanColumnColor, updateKanbanColumnTitle 
} from "@/actions/kanban";

const COLUMN_COLORS = [
  "#64748b", // Slate (Trầm)
  "#2563eb", // Blue (Đậm)
  "#059669", // Emerald (Xanh lá đậm)
  "#d97706", // Amber (Vàng cam)
  "#dc2626", // Red (Đỏ)
  "#7c3aed", // Violet (Tím)
  "#db2777", // Pink (Hồng)
];

export function KanbanBoard({ 
  initialRequests, 
  clients,
  users = [],
  initialColumns = [],
  currentUser = { role: 'ADMIN' }
}: { 
  initialRequests: any[], 
  clients: any[],
  users?: any[],
  initialColumns?: any[],
  currentUser?: { id?: string; role: string; name?: string }
}) {
  const [requests, setRequests] = useState(initialRequests);
  const [columns, setColumns] = useState(initialColumns);
  const [activeRequest, setActiveRequest] = useState<any>(null);
  
  // States for Filtering
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [selectedPackageId, setSelectedPackageId] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [filterMyTasks, setFilterMyTasks] = useState(false);

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [colorPickerColId, setColorPickerColId] = useState<string | null>(null);
  const [editingColId, setEditingColId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [activeTabIndex, setActiveTabIndex] = useState(0); // Mobile tab index

  // States for Modals
  const [detailRequestId, setDetailRequestId] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  const isAdmin = currentUser.role === 'ADMIN';
  const isReadOnly = currentUser.role === 'MANAGER';

  // Called by RequestDetailView after a successful save
  const handleRequestSaved = (updatedRequest: any) => {
    setRequests(prev => prev.map(r => r.id === updatedRequest.id ? updatedRequest : r));
  };

  // Ref to track the ORIGINAL status before drag starts
  const dragOriginalStatus = useRef<string | null>(null);

  // Fix hydration mismatch
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Sync state with props when server re-renders (router.refresh)
  useEffect(() => {
    setRequests(initialRequests);
  }, [initialRequests]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredRequests = useMemo(() => {
    return requests.filter(r => {
      const titleMatch = r.title.toLowerCase().includes(searchQuery.toLowerCase());
      const codeMatch = r.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchSearch = titleMatch || codeMatch;
      const matchClient = selectedClientId === "all" || r.clientId === selectedClientId;
      const matchPackage = selectedPackageId === "all" || r.packageId === selectedPackageId;
      const matchType = selectedType === "all" || r.type === selectedType;
      
      let matchMine = true;
      if (filterMyTasks && currentUser?.id) {
        matchMine = r.assigneeId === currentUser.id || r.client?.ownerId === currentUser.id;
      }

      return matchSearch && matchClient && matchPackage && matchType && matchMine;
    });
  }, [requests, searchQuery, selectedClientId, selectedPackageId, selectedType, filterMyTasks, currentUser?.id]);

  const requestsByStatus = useMemo(() => {
    return columns.reduce((acc, col) => {
      let colRequests = filteredRequests.filter(r => r.status === col.statusKey);
      
      // Special logic for DONE column: Only show items from last 7 days OR top 10 newest
      if (col.statusKey === "DONE") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        colRequests = colRequests
          .filter(r => {
            const dateToCheck = r.updatedAt ? new Date(r.updatedAt) : new Date(r.createdAt);
            return dateToCheck >= sevenDaysAgo;
          })
          .slice(0, 10); // Cap at 10 items
      }
      
      acc[col.statusKey] = colRequests;
      return acc;
    }, {} as Record<string, any[]>);
  }, [filteredRequests, columns]);

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;
    const result = await createKanbanColumn(newColumnTitle);
    if (result.success) {
      setColumns([...columns, result.col]);
      setNewColumnTitle("");
      setIsAddingColumn(false);
      toast.success("Đã thêm danh sách mới");
    }
  };

  const handleDeleteColumn = async (id: string, statusKey: string) => {
    if (["TODO", "IN_PROGRESS", "DONE"].includes(statusKey.toUpperCase())) {
      toast.error("Không thể xóa các cột mặc định");
      return;
    }

    const isConfirmed = window.confirm("Bạn có chắc chắn muốn xóa danh sách này? Các yêu cầu trong cột sẽ không bị mất nhưng bạn sẽ không thấy chúng trên bảng Kanban này nữa.");
    
    if (isConfirmed) {
      const colTitle = getColTitle(columns.find(c => c.id === id));
      const confirmName = window.prompt(`Để xác nhận xóa, vui lòng nhập chính xác tên cột "${colTitle}":`);
      
      if (confirmName && confirmName.trim().toLowerCase() === colTitle.toLowerCase()) {
        const result = await deleteKanbanColumn(id);
        if (result.success) {
          setColumns(columns.filter(c => c.id !== id));
          toast.success("Đã xóa danh sách");
        } else if (result.error) {
          toast.error("Lỗi khi xóa: " + result.error);
        }
      } else if (confirmName !== null) {
        toast.error("Tên xác nhận không chính xác");
      }
    }
  };



  const handleColorChange = async (colId: string, color: string) => {
    const result = await updateKanbanColumnColor(colId, color);
    if (result.success) {
      setColumns(columns.map(c => c.id === colId ? { ...c, color } : c));
      setColorPickerColId(null);
    }
  };

  const handleRenameColumn = async (id: string) => {
    if (!editingTitle.trim()) return;
    const result = await updateKanbanColumnTitle(id, editingTitle);
    if (result.success) {
      setColumns(columns.map(c => c.id === id ? { ...c, title: editingTitle } : c));
      setEditingColId(null);
    }
  };

  const selectedRequest = useMemo(() => 
    requests.find(r => r.id === detailRequestId), 
  [requests, detailRequestId]);

  const handleDragStart = (event: any) => {
    if (isReadOnly) return;
    const { active } = event;
    const request = requests.find(r => r.id === active.id);
    setActiveRequest(request);
    dragOriginalStatus.current = request?.status || null;
  };

  const handleDragOver = (event: any) => {
    if (isReadOnly) return;
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    const activeReq = requests.find((r) => r.id === activeId);
    if (!activeReq) return;

    const isOverAColumn = columns.some((col) => col.statusKey === overId);
    const isOverATask = requests.some((r) => r.id === overId);

    if (isOverAColumn && activeReq.status !== overId) {
      setRequests((prev) => 
        prev.map((r) => r.id === activeId ? { ...r, status: overId } : r)
      );
    } else if (isOverATask) {
      const overReq = requests.find((r) => r.id === overId);
      if (overReq && activeReq.status !== overReq.status) {
        setRequests((prev) => 
          prev.map((r) => r.id === activeId ? { ...r, status: overReq.status } : r)
        );
      }
    }
  };

  const handleDragEnd = async (event: any) => {
    if (isReadOnly) {
      setActiveRequest(null);
      return;
    }
    const { active, over } = event;
    setActiveRequest(null);

    if (!over) {
      dragOriginalStatus.current = null;
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    const isOverAColumn = columns.some((col) => col.statusKey === overId);
    let nextStatus = overId;

    if (!isOverAColumn) {
      const overReq = requests.find((r) => r.id === overId);
      if (overReq) nextStatus = overReq.status;
    }

    if (dragOriginalStatus.current !== null && dragOriginalStatus.current !== nextStatus) {
      const result = await updateRequestStatus(activeId, nextStatus);
      if (result?.error) {
        setRequests(prev => prev.map(r => r.id === activeId ? { ...r, status: dragOriginalStatus.current! } : r));
        toast.error(result.error);
      } else {
        toast.success("Cập nhật trạng thái thành công");
      }
    }

    dragOriginalStatus.current = null;
  };

  const getColTitle = (col: any) => {
    if (col.statusKey === "TODO") return "Cần làm";
    if (col.statusKey === "IN_PROGRESS") return "Đang xử lý";
    if (col.statusKey === "DONE") return "Hoàn thành";
    return col.title;
  };

  if (!mounted) {
    return (
      <div className="h-full flex flex-col bg-slate-50/30 dark:bg-slate-950/30 rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner">
        <div className="p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-3">
            <div className="h-10 w-64 bg-slate-100 rounded-2xl animate-pulse" />
            <div className="h-10 w-40 bg-slate-100 rounded-2xl animate-pulse" />
          </div>
        </div>
        <div className="flex-1 p-6 flex gap-8">
          {[1,2,3].map(i => (
            <div key={i} className="min-w-[320px] bg-slate-100/50 rounded-[32px] p-4 animate-pulse">
              <div className="h-6 w-24 bg-slate-200 rounded-xl mb-6" />
              {[1,2].map(j => (
                <div key={j} className="bg-white rounded-2xl p-5 mb-4 space-y-3">
                  <div className="h-4 w-full bg-slate-100 rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-slate-50/30 dark:bg-slate-950/30 rounded-[24px] md:rounded-[40px] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-inner">
      {/* Toolbar */}
      <div className="p-3 md:p-6 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 md:gap-3 w-full md:w-auto">
          <div className="relative group flex-1 md:flex-none">
            <Search className="w-4 h-4 absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm mã hoặc tiêu đề..."
              className="pl-9 md:pl-11 pr-4 py-2 md:py-2.5 bg-slate-50/50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800 rounded-xl md:rounded-2xl text-sm outline-none focus:ring-4 focus:ring-indigo-500/5 focus:bg-white dark:focus:bg-slate-800 focus:border-indigo-200 dark:focus:border-indigo-800 transition-all w-full md:w-64 font-semibold text-slate-900 dark:text-slate-100 placeholder:font-medium"
            />

          </div>


          <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <select 
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
            >

              <option value="all" className="dark:bg-slate-900">Khách hàng</option>
              {clients.map(c => (
                <option key={c.id} value={c.id} className="dark:bg-slate-900">{c.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 md:gap-2 px-3 md:px-4 py-2 md:py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-xl md:rounded-2xl border border-slate-100 dark:border-slate-800">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select 
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="bg-transparent text-xs md:text-sm font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer"
            >

              <option value="all" className="dark:bg-slate-900">Loại Ticket</option>
              <option value="TASK" className="dark:bg-slate-900">📋 Công việc</option>
              <option value="BUG" className="dark:bg-slate-900">🐞 Lỗi hệ thống</option>
              <option value="FEATURE" className="dark:bg-slate-900">🚀 Tính năng mới</option>
              <option value="URGENT" className="dark:bg-slate-900">⚠️ Khẩn cấp</option>
            </select>
          </div>

          <button 
            onClick={() => setFilterMyTasks(!filterMyTasks)}
            className={`flex items-center gap-2 px-4 py-2 md:py-2.5 rounded-xl md:rounded-2xl border transition-all ${
              filterMyTasks 
              ? "bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200 dark:shadow-none" 
              : "bg-slate-50 dark:bg-slate-950/50 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:bg-slate-100"
            }`}
          >
            <UserCheck className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:inline">Việc của tôi</span>
          </button>
        </div>

        {(selectedClientId !== "all" || selectedPackageId !== "all" || selectedType !== "all" || searchQuery) && (
          <button 
            onClick={() => {
              setSelectedClientId("all");
              setSelectedPackageId("all");
              setSelectedType("all");
              setSearchQuery("");
              setFilterMyTasks(false);
            }}
            className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest hover:underline px-2"
          >
            Xóa lọc
          </button>
        )}


        {/* Add Column Button in Toolbar */}
        {isAdmin && (
          <button 
            onClick={() => setIsAddingColumn(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-2xl hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 ml-auto md:ml-0"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[10px] font-black uppercase tracking-widest">Thêm cột</span>
          </button>
        )}

      </div>

      {/* Mobile Tab Bar */}
      <div className="md:hidden flex overflow-x-auto bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 px-3 gap-1 scrollbar-hide">
        {columns.map((col, idx) => {
          const count = (requestsByStatus[col.statusKey] || []).length;
          return (
            <button
              key={col.id}
              onClick={() => setActiveTabIndex(idx)}
              className={`flex items-center gap-1.5 px-4 py-3 text-xs font-black uppercase tracking-wider whitespace-nowrap border-b-2 transition-all shrink-0 ${
                activeTabIndex === idx
                  ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color || '#94a3b8' }} />
              {getColTitle(col)}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                activeTabIndex === idx ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>{count}</span>
            </button>

          );
        })}
      </div>

      {/* Board Area */}
      <div className="flex-1 min-h-0 overflow-x-auto p-2 md:p-4 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          {/* Mobile: single column view */}
          <div className="md:hidden h-full">
            {columns[activeTabIndex] && (() => {
              const col = columns[activeTabIndex];
              return (
                <KanbanColumn 
                  id={col.statusKey} 
                  title={getColTitle(col)}
                  statusKey={col.statusKey}
                  requests={requestsByStatus[col.statusKey] || []}
                  color={col.color || undefined}
                  isAdmin={isAdmin}
                  isReadOnly={isReadOnly}
                  onAddClick={() => {
                    if (isReadOnly) return;
                    setIsQuickAddOpen(true);
                  }}
                  onCardClick={(id) => setDetailRequestId(id)}
                  onColorChange={() => setColorPickerColId(colorPickerColId === col.id ? null : col.id)}
                  isColorPickerOpen={colorPickerColId === col.id}
                  onEditClick={() => {
                    setEditingColId(col.id);
                    setEditingTitle(col.title);
                  }}
                  onDeleteClick={() => handleDeleteColumn(col.id, col.statusKey)}
                />
              );
            })()}
          </div>

          {/* Desktop: horizontal scroll layout */}
          <div className="hidden md:flex gap-4 h-full items-start">
            {columns.map((col) => (
              <div key={col.id} className="relative group/col h-full flex flex-col pt-8">
                {editingColId === col.id ? (
                   <div className="min-w-[320px] bg-white dark:bg-slate-900 p-6 rounded-[32px] border-2 border-indigo-500 shadow-2xl z-50 animate-in zoom-in-95">
                      <input 
                        autoFocus
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 rounded-2xl text-sm font-black outline-none mb-4 focus:ring-4 focus:ring-indigo-500/5 transition-all text-slate-900 dark:text-slate-100"
                      />
                      <div className="flex gap-3">
                        <button onClick={() => handleRenameColumn(col.id)} className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Lưu lại</button>
                        <button onClick={() => setEditingColId(null)} className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest">Hủy</button>
                      </div>

                   </div>
                ) : (
                  <>
                    <KanbanColumn 
                      id={col.statusKey} 
                      title={getColTitle(col)}
                      statusKey={col.statusKey}
                      requests={requestsByStatus[col.statusKey] || []}
                      color={col.color || undefined}
                      isAdmin={isAdmin}
                      isReadOnly={isReadOnly}
                      onAddClick={() => {
                        if (isReadOnly) return;
                        setIsQuickAddOpen(true);
                      }}
                      onCardClick={(id) => setDetailRequestId(id)}
                      onColorChange={() => setColorPickerColId(colorPickerColId === col.id ? null : col.id)}
                      isColorPickerOpen={colorPickerColId === col.id}
                      onEditClick={() => {
                        setEditingColId(col.id);
                        setEditingTitle(col.title);
                      }}
                      onDeleteClick={() => handleDeleteColumn(col.id, col.statusKey)}
                    />

                    {/* Color Picker Popover */}
                    {colorPickerColId === col.id && (
                      <div className="absolute top-12 left-8 z-50 bg-white dark:bg-slate-900 p-3 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 flex gap-2 animate-in zoom-in-95">
                        {COLUMN_COLORS.map(c => (
                          <button 
                            key={c}
                            onClick={() => handleColorChange(col.id, c)}
                            className="w-6 h-6 rounded-full border-2 border-white shadow-sm hover:scale-125 transition-transform"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Add Column Button placeholder removed from here */}

          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: "0.5",
                },
              },
            }),
          }}>
            {activeRequest ? (
              <div className="rotate-3 scale-105 shadow-2xl transition-transform w-[300px]">
                <KanbanCard request={activeRequest} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Detail Modal */}
      <Modal 
        isOpen={!!detailRequestId} 
        onClose={() => setDetailRequestId(null)}
        title={selectedRequest ? `YÊU CẦU: ${selectedRequest.code}` : "Chi tiết ticket"}
        maxWidth="max-w-7xl"
      >
        {selectedRequest && (
          <RequestDetailView 
            request={selectedRequest} 
            clients={clients} 
            users={users}
            isModal={true}
            onSaved={handleRequestSaved}
            kanbanColumns={columns}
          />
        )}
      </Modal>

      {/* Quick Add Form Triggered by + button */}
      {isQuickAddOpen && (
        <RequestForm 
          clients={clients} 
          users={users}
          onClose={() => setIsQuickAddOpen(false)}
          autoOpen={true}
        />
      )}

      {/* Add Column Modal */}
      <Modal 
        isOpen={isAddingColumn} 
        onClose={() => setIsAddingColumn(false)} 
        title="TẠO DANH MỤC CỘT MỚI"
        maxWidth="max-w-md"
      >
        <div className="space-y-4">
          <input 
            autoFocus
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddColumn()}
            placeholder="Nhập tên danh mục (VD: Test, Review...)"
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900 dark:text-slate-100"
          />
          <div className="flex gap-3">
            <button 
              onClick={handleAddColumn}
              className="flex-1 bg-indigo-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider shadow-lg shadow-indigo-500/20"
            >
              Xác nhận tạo
            </button>

            <button 
              onClick={() => setIsAddingColumn(false)}
              className="flex-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider"
            >
              Hủy bỏ
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
