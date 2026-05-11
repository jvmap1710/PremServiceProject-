"use client";

import { useState } from "react";
import { createClient, updateClient } from "@/actions/client";
import { Plus, X, Edit2, User } from "lucide-react";

interface ClientFormProps {
  tasUsers?: any[];
  initialData?: any;
}

export function ClientForm({ tasUsers = [], initialData }: ClientFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const isEdit = !!initialData;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    
    const result = isEdit 
      ? await updateClient(initialData.id, formData)
      : await createClient(formData);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }
    setPending(false);
  }

  return (
    <>
      {isEdit ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-sm font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Thêm khách hàng
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isEdit ? "Cập nhật khách hàng" : "Thêm khách hàng mới"}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleSubmit} className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="code" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Mã khách hàng (Viết tắt)
                  </label>
                  <input
                    type="text"
                    id="code"
                    name="code"
                    defaultValue={initialData?.code}
                    required
                    placeholder="VD: PREM-GT"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 transition-all shadow-inner"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="isActive" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Trạng thái
                  </label>
                  <select
                    id="isActive"
                    name="isActive"
                    defaultValue={initialData?.isActive?.toString() ?? "true"}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 transition-all shadow-inner"
                  >
                    <option value="true">Đang hoạt động</option>
                    <option value="false">Ngừng hoạt động</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Tên đầy đủ khách hàng
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  defaultValue={initialData?.name}
                  required
                  placeholder="VD: Công ty TNHH Green Tech Việt Nam"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 transition-all shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="picName" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Người liên hệ (PIC)
                  </label>
                  <input
                    type="text"
                    id="picName"
                    name="picName"
                    defaultValue={initialData?.picName}
                    placeholder="Tên PIC"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 transition-all shadow-inner"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="picContact" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                    Số điện thoại liên hệ
                  </label>
                  <input
                    type="text"
                    id="picContact"
                    name="picContact"
                    defaultValue={initialData?.picContact}
                    placeholder="SĐT liên hệ"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 transition-all shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="address" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Địa chỉ
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  defaultValue={initialData?.address}
                  placeholder="Địa chỉ trụ sở khách hàng"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 transition-all shadow-inner"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="ownerId" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-1">
                  Người phụ trách (Owner - TAS)
                </label>
                <div className="relative">
                  <select
                    id="ownerId"
                    name="ownerId"
                    defaultValue={initialData?.ownerId || ""}
                    className="w-full px-4 py-3 pl-11 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-900 dark:text-slate-100 transition-all shadow-inner appearance-none"
                  >
                    <option value="">-- Chưa gán --</option>
                    {tasUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name} ({user.role})
                      </option>
                    ))}
                  </select>
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-600 shrink-0" />
                  {error}
                </div>
              )}

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-3 text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-8 py-3 text-sm font-bold text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-95"
                >
                  {pending ? "Đang xử lý..." : isEdit ? "Cập nhật" : "Lưu khách hàng"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
