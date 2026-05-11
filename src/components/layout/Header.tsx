"use client";

import { logOut } from "@/actions/auth";
import { LogOut, User, Bell, Search, Menu, X } from "lucide-react";
import { SIDEBAR_TOGGLE_EVENT } from "./Sidebar";
import { useState, useEffect } from "react";
import { ThemeToggle } from "../ThemeToggle";
import Link from "next/link";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notification";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { useRouter } from "next/navigation";

interface HeaderProps {
  userName: string;
  userRole?: string;
}

export function Header({ userName, userRole = "TAS" }: HeaderProps) {
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);

  const handleToggleSidebar = () => {
    window.dispatchEvent(new Event(SIDEBAR_TOGGLE_EVENT));
  };

  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notiOpen, setNotiOpen] = useState(false);

  useEffect(() => {
    async function loadNotifications() {
      const result = await getNotifications();
      if (result.success && result.notifications) {
        setNotifications(result.notifications);
        setUnreadCount(result.notifications.filter((n: any) => !n.isRead).length);
      }
    }
    loadNotifications();
    // Poll every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    const result = await markAsRead(id);
    if (result.success) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const handleMarkAllAsRead = async () => {
    const result = await markAllAsRead();
    if (result.success) {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    }
  };

  const getRoleLabel = (role: string) => {
    switch(role.toUpperCase()) {
      case "ADMIN": return "Quản trị";
      case "TAS": return "Điều phối";
      case "DEV": return "Kỹ thuật";
      default: return role;
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 gap-3 transition-colors">
      {/* Left: Hamburger (mobile) + Search */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Hamburger — only on mobile */}
        <button
          onClick={handleToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shrink-0"
          aria-label="Mở menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Mobile Logo */}
        <Link href="/" className="lg:hidden shrink-0">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-black">
            P
          </div>
        </Link>

        {/* Search bar — always visible on md+, hidden on mobile unless toggled */}
        <div className={`relative group flex-1 max-w-md ${searchOpen ? 'flex' : 'hidden md:flex'}`}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            placeholder="Tìm kiếm yêu cầu, khách hàng..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-900 dark:text-slate-100"
            onBlur={() => setSearchOpen(false)}
            autoFocus={searchOpen}
          />
        </div>

        {/* Search icon button — only on mobile, when search is closed */}
        {!searchOpen && (
          <button
            onClick={() => setSearchOpen(true)}
            className="md:hidden p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors shrink-0"
          >
            <Search className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 md:gap-4 shrink-0">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Bell */}
        <div className="relative">
          <button 
            onClick={() => setNotiOpen(!notiOpen)}
            className={`relative transition-all p-1.5 rounded-lg ${
              notiOpen 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                : unreadCount > 0 
                  ? 'text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' 
                  : 'text-slate-400 dark:text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'
            }`}
          >
            <Bell className={`w-5 h-5 ${unreadCount > 0 ? 'animate-bounce-subtle' : ''}`} />
            {unreadCount > 0 && (
              <>
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-950 z-10" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-400 rounded-full animate-ping" />
              </>
            )}
          </button>

          {/* Dropdown */}
          {notiOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotiOpen(false)} />
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-[24px] border border-slate-100 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thông báo</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Đánh dấu tất cả đã đọc
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">Không có thông báo nào</div>
                  ) : (
                    notifications.map(n => (
                      <div 
                        key={n.id}
                        onClick={() => {
                          if (!n.isRead) handleMarkAsRead(n.id);
                          if (n.link) router.push(n.link);
                          setNotiOpen(false);
                        }}
                        className={`p-4 border-b border-slate-50 dark:border-slate-800 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors relative ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                      >
                        {!n.isRead && <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-full" />}
                        <p className="text-xs font-black text-slate-900 dark:text-slate-100 mb-1">{n.title}</p>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">{n.message}</p>
                        <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-2 font-medium uppercase tracking-tight">
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: vi })}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="h-8 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* User info */}
        <div className="flex items-center gap-2 md:gap-3">
          <div className="text-right hidden md:block">
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Xin chào,</p>
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate max-w-[150px] leading-none">
              {userName} <span className="text-blue-600 dark:text-blue-400 font-bold text-[10px]">({getRoleLabel(userRole)})</span>
            </p>
          </div>
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 shadow-sm border border-white dark:border-slate-800">
            <User className="w-4 h-4 md:w-6 md:h-6" />
          </div>
          <form action={logOut}>
            <button
              type="submit"
              className="p-1.5 md:p-2 text-slate-400 dark:text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
              title="Đăng xuất"
            >
              <LogOut className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
