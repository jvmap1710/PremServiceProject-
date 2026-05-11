"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Users, UserPlus, Shield, User as UserIcon, 
  Settings, Trash2, Mail, Calendar, Edit2, 
  Search, Filter, ChevronRight, CheckCircle2, XCircle, Key, Plus
} from "lucide-react";
import { getUsers, updateUserRole, updateUserInfo, deleteUser, createUser, resetUserPassword } from "@/actions/user";
import { Modal } from "@/components/ui/Modal";

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
        setEditingUser(null);
        fetchUsers();
      } else {
        alert("Lỗi: " + (res1.error || res2.error));
      }
    });
  };

  const handleCreate = async () => {
    if (!createForm.username || !createForm.name) {
      alert("Vui lòng điền đủ Username và Họ tên.");
      return;
    }
    startTransition(async () => {
      const res = await createUser(createForm);
      if (res.success) {
        setIsCreateModalOpen(false);
        setCreateForm({ username: "", name: "", role: "TAS", password: "" });
        fetchUsers();
      } else {
        alert("Lỗi: " + res.error);
      }
    });
  };

  const handleResetPassword = async () => {
    if (!editingUser) return;
    if (!confirm(`Bạn có chắc chắn muốn Reset mật khẩu cho ${editingUser.name} về mặc định (password123)?`)) return;
    
    startTransition(async () => {
      const res = await resetUserPassword(editingUser.id);
      if (res.success) {
        alert("Reset mật khẩu thành công! Mật khẩu mới là: password123");
      } else {
        alert("Lỗi: " + res.error);
      }
    });
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa user này? Hành động này không thể hoàn tác.")) return;
    const res = await deleteUser(userId);
    if (res.success) {
      fetchUsers();
    } else {
      alert(res.error);
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
            Quản lý Nhân sự
          </h1>
          <p className="text-slate-500 font-medium mt-2">Điều chỉnh vai trò và thông tin tài khoản hệ thống</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Thêm nhân sự
          </button>

          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm tên hoặc username..." 
              className="pl-11 pr-6 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all w-64 shadow-sm"
            />
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Tổng nhân sự</p>
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
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Thành viên</th>
                <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Vai trò</th>
                <th className="py-6 px-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Ngày gia nhập</th>
                <th className="py-6 px-8 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-20 text-center text-slate-400 font-bold italic">Đang tải danh sách...</td>
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
                      <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
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
        title="THÊM NHÂN SỰ MỚI"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username (Dùng để đăng nhập)</label>
              <input 
                value={createForm.username}
                onChange={(e) => setCreateForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="vd: nguyen.van.a"
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và Tên</label>
              <input 
                value={createForm.name}
                onChange={(e) => setCreateForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nguyễn Văn A"
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò hệ thống</label>
              <select 
                value={createForm.role}
                onChange={(e) => setCreateForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none cursor-pointer"
              >
                <option value="TAS">TAS (Tư vấn nghiệp vụ)</option>
                <option value="IMP_ENGINEER">Imp Engineer (Kỹ sư triển khai)</option>
                <option value="MANAGER">Manager (Ban giám đốc - Readonly)</option>
                <option value="ADMIN">System Admin (Toàn quyền)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mật khẩu (Mặc định: password123)</label>
              <input 
                type="password"
                value={createForm.password}
                onChange={(e) => setCreateForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Để trống để dùng mật khẩu mặc định"
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
          </div>

          <button 
            onClick={handleCreate}
            disabled={isPending}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20"
          >
            {isPending ? "Đang xử lý..." : "Tạo tài khoản"}
          </button>
        </div>
      </Modal>

      {/* Edit User Modal */}
      <Modal 
        isOpen={!!editingUser} 
        onClose={() => setEditingUser(null)} 
        title="CHỈNH SỬA THÀNH VIÊN"
        maxWidth="max-w-md"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Username (Tên đăng nhập - Không thể đổi)</label>
              <div className="w-full bg-slate-50 dark:bg-slate-950/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold text-slate-400">
                @{editingUser?.username}
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Họ và Tên</label>
              <input 
                value={editForm.name}
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email (Không bắt buộc)</label>
              <input 
                value={editForm.email}
                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none" 
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò hệ thống</label>
              <select 
                value={editForm.role}
                onChange={(e) => setEditForm(prev => ({ ...prev, role: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 text-sm font-bold outline-none cursor-pointer"
              >
                <option value="TAS">TAS (Tư vấn nghiệp vụ)</option>
                <option value="IMP_ENGINEER">Imp Engineer (Kỹ sư triển khai)</option>
                <option value="MANAGER">Manager (Ban giám đốc - Readonly)</option>
                <option value="ADMIN">System Admin (Toàn quyền)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-slate-50 dark:border-slate-800">
            <button 
              onClick={handleSave}
              disabled={isPending}
              className="w-full bg-indigo-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100 dark:shadow-indigo-900/20"
            >
              {isPending ? "Đang lưu..." : "Cập nhật tài khoản"}
            </button>
            <button 
              onClick={handleResetPassword}
              disabled={isPending}
              className="w-full bg-slate-50 dark:bg-slate-900 text-slate-500 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-slate-800 flex items-center justify-center gap-2"
            >
              <Key className="w-4 h-4" />
              Reset Mật khẩu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
