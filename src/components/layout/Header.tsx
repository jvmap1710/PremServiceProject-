"use client";

import { logOut } from "@/actions/auth";
import { changeMyPassword } from "@/actions/user";
import { LogOut, User, Bell, Search, Menu, X, Key, CheckCircle2 } from "lucide-react";
import { SIDEBAR_TOGGLE_EVENT } from "./Sidebar";
import { useState, useEffect, useTransition } from "react";
import { ThemeToggle } from "../ThemeToggle";
import Link from "next/link";
import { getNotifications, markAsRead, markAllAsRead } from "@/actions/notification";
import { formatDistanceToNow } from "date-fns";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { toast } from "react-hot-toast";

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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Change Password state
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: "", new: "", confirm: "" });

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.new !== pwdForm.confirm) {
      toast.error("Confirm password does not match!");
      return;
    }
    if (pwdForm.new.length < 6) {
      toast.error("New password must be at least 6 characters!");
      return;
    }

    startTransition(async () => {
      const result = await changeMyPassword(pwdForm.old, pwdForm.new);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("Password changed successfully!");
        setIsPasswordModalOpen(false);
        setPwdForm({ old: "", new: "", confirm: "" });
      }
    });
  };

  useEffect(() => {
    async function loadNotifications() {
      try {
        const result = await getNotifications();
        if (result.success && result.notifications) {
          setNotifications(result.notifications);
          setUnreadCount(result.notifications.filter((n: any) => !n.isRead).length);
        }
      } catch (error) {
        // Silent error for notification polling to avoid console noise during auth transitions
        console.warn("Notifications currently unavailable (polling)");
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
      case "ADMIN": return "Admin";
      case "TAS": return "Coordinator";
      case "DEV": return "Engineer";
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
          aria-label="Open menu"
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
            placeholder="Search requests, clients..."
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all font-medium text-slate-900 dark:text-slate-100"
            onBlur={() => setSearchOpen(false)}
            autoFocus={searchOpen}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const searchVal = e.currentTarget.value;
                if (searchVal.trim()) {
                  router.push(`/requests?search=${encodeURIComponent(searchVal.trim())}`);
                } else {
                  router.push(`/requests`);
                }
              }
            }}
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
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                <div className="max-h-[400px] overflow-y-auto scrollbar-hide">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 italic text-xs">No notifications</div>
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
                          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
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

        {/* User info & Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 md:gap-3 p-1 rounded-full hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors focus:outline-none"
          >
            <div className="text-right hidden md:block">
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-black uppercase tracking-widest leading-none mb-1">Welcome,</p>
              <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate max-w-[150px] leading-none">
                {userName} <span className="text-blue-600 dark:text-blue-400 font-bold text-[10px]">({getRoleLabel(userRole)})</span>
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-700 dark:text-blue-400 shrink-0 shadow-sm border border-white dark:border-slate-800">
              <User className="w-4 h-4 md:w-6 md:h-6" />
            </div>
          </button>

          {/* User Dropdown Menu */}
          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 rounded-[20px] border border-slate-100 dark:border-slate-800 shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200 py-2">
                <button
                  onClick={() => {
                    setUserMenuOpen(false);
                    setIsPasswordModalOpen(true);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                >
                  <Key className="w-4 h-4" />
                  Change Password
                </button>
                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1 mx-2" />
                <form action={logOut} className="w-full">
                  <button
                    type="submit"
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Change Password Modal */}
      <Modal 
        isOpen={isPasswordModalOpen} 
        onClose={() => !isPending && setIsPasswordModalOpen(false)}
        title="CHANGE PASSWORD"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Current Password</label>
            <input 
              type="password"
              value={pwdForm.old}
              onChange={e => setPwdForm({ ...pwdForm, old: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">New Password</label>
            <input 
              type="password"
              value={pwdForm.new}
              onChange={e => setPwdForm({ ...pwdForm, new: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              required
              disabled={isPending}
            />
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Confirm New Password</label>
            <input 
              type="password"
              value={pwdForm.confirm}
              onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all font-semibold"
              required
              disabled={isPending}
            />
          </div>
          <button 
            type="submit"
            disabled={isPending}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isPending ? "Processing..." : <><CheckCircle2 className="w-4 h-4" /> Change Password</>}
          </button>
        </form>
      </Modal>
    </header>
  );
}
