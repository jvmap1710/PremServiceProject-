"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { menuItems } from "@/lib/menu-items";
import { cn } from "@/lib/utils";
import { ChevronRight, Menu } from "lucide-react";
import { useState, useEffect } from "react";
import { SidebarTasks } from "./SidebarTasks";
import { Modal } from "../ui/Modal";

interface SidebarProps {
  role: string;
}

export const SIDEBAR_TOGGLE_EVENT = "toggle-sidebar";

export function Sidebar({ role }: SidebarProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved !== null) {
      setIsCollapsed(saved === "true");
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(isCollapsed));
  }, [isCollapsed]);

  useEffect(() => {
    const handler = () => setIsOpen(prev => !prev);
    window.addEventListener(SIDEBAR_TOGGLE_EVENT, handler);
    return () => window.removeEventListener(SIDEBAR_TOGGLE_EVENT, handler);
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  const filteredMenu = menuItems.filter((item) => item.roles.includes(role));

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={cn("p-6 flex items-center justify-between", isCollapsed && "px-4")}>
        <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">
            P
          </div>
          {!isCollapsed && (
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Premium Service
            </span>
          )}
        </Link>
        
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden lg:flex p-1.5 rounded-lg text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all ml-2"
          title={isCollapsed ? "Mở rộng" : "Thu gọn"}
        >
          <ChevronRight className={cn("w-4 h-4 transition-transform duration-300", !isCollapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide">
        {filteredMenu.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          const showHeader = (item as any).isCategory;

          return (
            <div key={item.href}>
              {showHeader && !isCollapsed && (
                <div className="pt-6 pb-2 px-3">
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Quản trị hệ thống</p>
                </div>
              )}
              {showHeader && isCollapsed && <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />}
              
              <Link
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group",
                  isActive
                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 shadow-sm"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100",
                  isCollapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-colors shrink-0", isActive ? "text-indigo-600" : "text-slate-400 group-hover:text-slate-600")} />
                {!isCollapsed && <span>{item.title}</span>}
              </Link>
            </div>
          );
        })}

        {!isCollapsed && (
          <div className="pt-8 pb-2 px-3 flex justify-between items-center group">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Công việc của tôi</p>
          </div>
        )}
        {isCollapsed && <div className="h-px bg-slate-100 dark:bg-slate-800 my-4" />}
        <SidebarTasks isCollapsed={isCollapsed} onItemClick={() => setIsOpen(false)} />
      </nav>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Công việc của tôi" maxWidth="max-w-md">
        <div className="p-6">
          <p className="text-sm text-slate-500">Đây là danh sách các yêu cầu đang được giao cho bạn hoặc thuộc khách hàng bạn quản lý.</p>
        </div>
      </Modal>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Desktop/Mobile */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 lg:static lg:block",
        isOpen ? "translate-x-0 w-72" : "-translate-x-full lg:translate-x-0",
        isCollapsed ? "lg:w-20" : "lg:w-72"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}
