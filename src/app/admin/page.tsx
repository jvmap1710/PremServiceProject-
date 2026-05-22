import { auth } from "@/auth";
import { Settings, Shield, Users, Mail, ArrowRight, LayoutDashboard } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AdminPage() {
  const session = await auth();

  // Check permission directly at server component for security
  if (!session || (session.user as any).role !== "ADMIN") {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-slate-950 p-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Admin Control Panel</h1>
            <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">System management and Premium service configuration</p>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Current User</p>
              <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{session.user?.name}</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Email Settings Card */}
          <Link href="/admin/settings/email" className="group">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 dark:bg-blue-900/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="relative space-y-6">
                <div className="w-14 h-14 bg-blue-600 dark:bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200 dark:shadow-none">
                  <Mail className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">Email Settings</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Configure SMTP, email protocols, and automatic system notifications.</p>
                </div>

                <div className="flex items-center gap-2 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                  Configure Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* System Settings Card */}
          <Link href="/admin/settings" className="group">
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl dark:hover:shadow-indigo-900/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 dark:bg-indigo-900/20 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
              
              <div className="relative space-y-6">
                <div className="w-14 h-14 bg-indigo-600 dark:bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200 dark:shadow-none">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">System Settings</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">Manage standard working hours, revenue models, and global parameters.</p>
                </div>

                <div className="flex items-center gap-2 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
                  Configure Now <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>

          {/* User Management Placeholder */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm opacity-60 grayscale cursor-not-allowed relative overflow-hidden h-full">
             <div className="relative space-y-6">
                <div className="w-14 h-14 bg-slate-200 dark:bg-slate-800 rounded-2xl flex items-center justify-center">
                  <Users className="w-6 h-6 text-slate-400 dark:text-slate-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-400 dark:text-slate-500">User Management</h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500 mt-2 leading-relaxed">Manage user list, role assignment for TAS/DEV and Admin.</p>
                </div>
                <div className="text-[10px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest italic">Coming Soon</div>
              </div>
          </div>

          {/* System Status Card */}
          <Link href="/" className="group">
            <div className="bg-slate-900 dark:bg-blue-600/10 p-8 rounded-[32px] shadow-2xl shadow-slate-200 dark:shadow-none border border-transparent dark:border-blue-900/30 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden h-full">
              <div className="absolute bottom-0 right-0 w-40 h-40 bg-white/5 rounded-full -mb-20 -rb-20" />
              
              <div className="relative space-y-6">
                <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                  <LayoutDashboard className="w-6 h-6 text-white" />
                </div>
                
                <div>
                  <h3 className="text-xl font-black text-white">Back to Dashboard</h3>
                  <p className="text-sm text-slate-400 mt-2 leading-relaxed">Return to the main dashboard to manage service requests.</p>
                </div>

                <div className="flex items-center gap-2 text-white text-[10px] font-black uppercase tracking-widest">
                  Go Back <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Security Warning */}
        <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 flex gap-4 items-start">
          <Shield className="w-6 h-6 text-amber-500 dark:text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-black text-amber-900 dark:text-amber-200 uppercase tracking-tight">Sensitive Area</p>
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400 leading-relaxed mt-1">
              You are accessing the administrative area. Any changes to email configuration will affect the system's ability to send notifications. Please be careful when editing SMTP parameters.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
