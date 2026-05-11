"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { KanbanCard } from "./KanbanCard";
import { Plus, Palette, Edit3, Trash2 } from "lucide-react";


export function KanbanColumn({ 
  id, 
  title, 
  requests,
  color = "#94a3b8",
  onAddClick,
  onCardClick,
  onColorChange,
  isAdmin,
  onEditClick,
  onDeleteClick,
  isColorPickerOpen,
  isReadOnly,
  statusKey
}: { 
  id: string, 
  title: string, 
  requests: any[],
  color?: string,
  onAddClick?: () => void,
  onCardClick?: (id: string) => void,
  onColorChange?: () => void,
  isAdmin?: boolean,
  isReadOnly?: boolean,
  onEditClick?: () => void,
  onDeleteClick?: () => void,
  isColorPickerOpen?: boolean,
  statusKey?: string
}) {
  const { setNodeRef } = useDroppable({ id });

  return (
    <div className="flex flex-col h-full min-w-[280px] md:min-w-[320px] max-w-[420px] flex-1 bg-slate-50/50 dark:bg-slate-900/20 backdrop-blur-sm rounded-[32px] p-4 md:p-5 border border-slate-100 dark:border-slate-800/50 transition-all relative">
      <div className="flex items-center justify-between mb-6 px-3 group/header relative">
        {/* Floating Admin Tab - Only shows on header hover */}
        {isAdmin && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 pb-4 pt-2 px-4 opacity-0 group-hover/header:opacity-100 group-hover/header:-top-9 transition-all z-50 pointer-events-none group-hover/header:pointer-events-auto">
            <div className="flex items-center gap-1.5 bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-2.5 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-900/30 shadow-xl ring-4 ring-indigo-500/5">
              <button 
                onClick={(e) => { e.stopPropagation(); onColorChange?.(); }}
                className={`p-1.5 rounded-full transition-all hover:scale-110 ${
                  isColorPickerOpen ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
                }`}
                title="Đổi màu"
              >
                <Palette className="w-3 h-3" />
              </button>
              <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-0.5" />
              <button 
                onClick={(e) => { e.stopPropagation(); onEditClick?.(); }}
                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-full hover:scale-110 transition-all"
                title="Sửa tên"
              >
                <Edit3 className="w-3 h-3" />
              </button>
              {!(statusKey && ["TODO", "IN_PROGRESS", "DONE"].includes(statusKey.toUpperCase())) && (
                <>
                  <div className="w-px h-3 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      console.log("DEBUG - Delete button clicked for:", statusKey);
                      onDeleteClick?.(); 
                    }}
                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full hover:scale-110 transition-all"
                    title="Xóa cột"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}



        <div className="flex items-center gap-3">
          <div 
            onClick={onColorChange}
            className="w-2.5 h-6 rounded-full cursor-pointer hover:scale-x-150 transition-transform shadow-sm" 
            style={{ backgroundColor: color }}
            title="Đổi màu danh mục"
          />
          <h3 className="font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em] text-xs opacity-80">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onAddClick && !isReadOnly && statusKey === "TODO" && (
            <button 
              onClick={onAddClick}
              className="p-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-lg hover:bg-indigo-700 dark:hover:bg-indigo-600 transition-colors shadow-sm shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          )}

          <span className="bg-white dark:bg-slate-800 px-2.5 py-1 rounded-xl text-[10px] font-black text-slate-400 dark:text-slate-500 border border-slate-100 dark:border-slate-700 shadow-sm">
            {requests.length}
          </span>
        </div>
      </div>

      <div 
        ref={setNodeRef}
        className="flex-1 space-y-4 overflow-y-auto scrollbar-hide min-h-[500px] pb-10"
      >
        <SortableContext 
          id={id}
          items={requests.map(r => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {requests.map((request) => (
            <KanbanCard 
              key={request.id} 
              request={request} 
              columnColor={color}
              onClick={() => onCardClick?.(request.id)}
            />
          ))}
          
          {requests.length === 0 && (
            <div className="h-32 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center">
              <p className="text-xs text-slate-300 dark:text-slate-700 italic">Chưa có dữ liệu</p>
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
