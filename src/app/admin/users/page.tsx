"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Users, UserPlus, Shield, User as UserIcon, 
  Settings, Trash2, Mail, Calendar, Edit2, 
  Search, Filter, ChevronRight, CheckCircle2, XCircle, Key, Plus
} from "lucide-react";
import { getUsers, updateUserRole, updateUserInfo, deleteUser, createUser, resetUserPassword } from "@/actions/user";
import { Modal } from "@/components/ui/Modal";
import { toast } from "react-hot-toast";

export default function UserManagementPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isPending, startTransition] = useTransition();

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ username: "", name: "", role: "TAS", password: "" });

  // Edit Modal State
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "" });

  // Reset Password Modal State
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    setLoading(true);
    const data = await getUsers();
    setUsers(data);
    setLoading(false);
  }

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEdit = (user: any) => {
    setEditingUser(user);
    setEditForm({ name: user.name, email: user.email || "", role: user.role });
  };

  const handleSave = async () => {
    if (!editingUser) return;
    startTransition(async () => {
      const res1 = await updateUserInfo(editingUser.id, { name: editForm.name, email: editForm.email });
      const res2 = await updateUserRole(editingUser.id, editForm.role);
      
      if (res1.success && res2.success) {
        toast.success("Update successful");
        setEditingUser(null);
        fetchUsers();
      } else {
        toast.error(res1.error || res2.error || "An error occurred");
      }
    });
  };

  const handleCreate = async () => {
    if (!createForm.username || !createForm.name) {
      toast.error("Please provide both Username and Full Name.");
      return;
    }
    startTransition(async () => {
      const res = await createUser(createForm);
      if (res.success) {
        toast.success("Account created successfully");
        setIsCreateModalOpen(false);
        setCreateForm({ username: "", name: "", role: "TAS", password: "" });
        fetchUsers();
      } else {
        toast.error(res.error || "An error occurred");
      }
    });
  };

  const handleResetPassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingUser) return;
    
    const finalPassword = resetPasswordValue.trim() || "password123";

    if (finalPassword.length > 0 && finalPassword.length < 6) {
      toast.error("Password must be at least 6 characters!");
      return;
    }
    
    startTransition(async () => {
      const res = await resetUserPassword(editingUser.id, finalPassword);
      if (res.success) {
        toast.success(`Password reset to: ${finalPassword}`);
        setIsResetModalOpen(false);
        setResetPasswordValue("");
      } else {
        toast.error(res.error || "An error occurred");
      }
    });
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user? This action cannot be undone.")) return;
    const res = await deleteUser(userId);
    if (res.success) {
      toast.success("Personnel deleted");
      fetchUsers();
    } else {
      toast.error(res.error || "An error occurred");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 space-y-8 animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20">
              <Users className="w-6 h-6 text-white" />
            </div>
            Personnel Management
          </h1>
          <p className="text-slate-500 font-medium mt-2">Adjust roles and system account information</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Add Personnel
          </button>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name or username..." 
              className="pl-11 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Personnel</p>
          <p className="text-3xl font-black text-slate-900 dark:text-white">{users.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Manager</p>
          <p className="text-3xl font-black text-rose-600">{users.filter(u => u.role === 'MANAGER').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Admin</p>
          <p className="text-3xl font-black text-indigo-600">{users.filter(u => u.role === 'ADMIN').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Imp Engineer</p>
          <p className="text-3xl font-black text-purple-600">{users.filter(u => u.role === 'IMP_ENGINEER').length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TAS</p>
          <p className="text-3xl font-black text-blue-600">{users.filter(u => u.role === 'TAS').length}</p>
        </div>
      </div>

      {/* Users Table Card */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Member</th>
                <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Role</th>
                <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Join Date</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-bold italic">Loading list...</td>
                </tr>
              ) : filteredUsers.map((user) => (
                <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-all">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                        <UserIcon className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900 dark:text-white leading-tight">{user.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 tracking-tight">@{user.username}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest inline-flex items-center gap-1.5 ${
                      user.role === 'ADMIN' ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                      user.role === 'IMP_ENGINEER' ? 'bg-purple-100 text-purple-600 border border-purple-200' :
                      user.role === 'MANAGER' ? 'bg-rose-100 text-rose-600 border border-rose-200' :
                      'bg-blue-100 text-blue-600 border border-blue-200'
                    }`}>
                      {user.role === 'ADMIN' && <Shield className="w-3 h-3" />}
                      {user.role.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-5 px-6">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString('en-US')}</span>
                      <span className="text-[9px] text-slate-400 font-medium uppercase tracking-tighter">Account Created</span>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                      <button 
                        onClick={() => handleOpenEdit(user)}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-indigo-600 transition-all shadow-sm"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(user.id)}
                        className="p-2 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-slate-400 hover:text-rose-600 transition-all shadow-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create User Modal */}
      <Modal 
        isOpen={isCreateModalOpen} 
        onClose={() => setIsCreateModalOpen(false)} 
        title="ADD NEW PERSONNEL"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username (For login)</label>
              <input 
                value={createForm.username}
                onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="ex: john.doe"
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input 
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="John Doe"
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role</label>
              <select 
                value={createForm.role}
                onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none cursor-pointer"
              >
                <option value="TAS">TAS (Business Consultant)</option>
                <option value="IMP_ENGINEER">Imp Engineer (Implementation)</option>
                <option value="MANAGER">Manager (Board - Readonly)</option>
                <option value="ADMIN">System Admin (Full Access)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password (Default: password123)</label>
              <input 
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Leave blank to use default password"
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
          </div>

          <button 
            onClick={handleCreate}
            disabled={isPending}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20"
          >
            {isPending ? "Processing..." : "Create Account"}
          </button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)} 
        title="EDIT MEMBER"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username (Login name - Cannot change)</label>
              <div className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-400">
                @{editingUser?.username}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Full Name</label>
              <input 
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email (Optional)</label>
              <input 
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Role</label>
              <select 
                value={editForm.role}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none cursor-pointer"
              >
                <option value="TAS">TAS (Business Consultant)</option>
                <option value="IMP_ENGINEER">Imp Engineer (Implementation)</option>
                <option value="MANAGER">Manager (Board - Readonly)</option>
                <option value="ADMIN">System Admin (Full Access)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
            <button 
              onClick={handleSave}
              disabled={isPending}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              {isPending ? "Saving..." : "Update Account"}
            </button>
            <button 
              onClick={() => {
                setResetPasswordValue("");
                setIsResetModalOpen(true);
              }}
              disabled={isPending}
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Key className="w-4 h-4" />
              Reset Password
            </button>
          </div>
        </div>
      </Modal>

      {/* Reset Password Modal */}
      <Modal 
        isOpen={isResetModalOpen} 
        onClose={() => !isPending && setIsResetModalOpen(false)}
        title="RESET PASSWORD"
        maxWidth="max-w-md"
      >
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-800">
            <p className="text-xs font-semibold text-amber-800 dark:text-amber-400">
              You are resetting the password for: <span className="font-black">@{editingUser?.username}</span>
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">New Password (Minimum 6 characters)</label>
            <input 
              type="text"
              value={resetPasswordValue}
              onChange={e => setResetPasswordValue(e.target.value)}
              placeholder="Leave blank to use default password (password123)"
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-semibold"
              disabled={isPending}
            />
          </div>
          <button 
            type="submit"
            disabled={isPending}
            className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[11px] uppercase tracking-widest py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-200 dark:shadow-none disabled:opacity-50 flex justify-center items-center gap-2"
          >
            {isPending ? "Processing..." : <><CheckCircle2 className="w-4 h-4" /> Confirm Reset</>}
          </button>
        </form>
      </Modal>
    </div>
  );
}
