"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { createPremiumPackage, updatePremiumPackage, deletePremiumPackage } from "@/actions/package";
import { Plus, X, Edit, Trash2, Calendar, Package as PackageIcon } from "lucide-react";

export function PackageForm({ 
  clientId, 
  initialData 
}: { 
  clientId: string;
  initialData?: { id: string; name: string; validFrom: Date | string; validTo: Date | string; isActive: boolean; monthlyPrice: number };
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isEdit = !!initialData;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    
    formData.set("clientId", clientId);
    if (isEdit) formData.set("id", initialData.id);
    if (isEdit) formData.set("isActive", formData.get("isActive") === "on" ? "true" : "false");

    const result = isEdit ? await updatePremiumPackage(formData) : await createPremiumPackage(formData);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
    }
    setPending(false);
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this Premium package? (All rules inside will also be deleted)")) return;
    setPending(true);
    const result = await deletePremiumPackage(initialData!.id, clientId);
    if (result?.error) setError(result.error);
    else setIsOpen(false);
    setPending(false);
  }

  return (
    <>
      {isEdit ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2.5 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all"
          title="Edit Package"
        >
          <Edit className="w-4.5 h-4.5" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Add Premium Package
        </button>
      )}

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                <PackageIcon className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                {isEdit ? "Edit Premium Package" : "Add New Premium Package"}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form action={handleSubmit} className="p-8 space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="name" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Package Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  defaultValue={initialData?.name}
                  placeholder="e.g. Prem Package 2026"
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label htmlFor="validFrom" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Valid From
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      id="validFrom"
                      name="validFrom"
                      required
                      defaultValue={initialData?.validFrom ? new Date(initialData.validFrom).toISOString().split('T')[0] : undefined}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="validTo" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Valid Until
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      id="validTo"
                      name="validTo"
                      required
                      defaultValue={initialData?.validTo ? new Date(initialData.validTo).toISOString().split('T')[0] : undefined}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="monthlyPrice" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                  Package Price (VND)
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400 pointer-events-none">₫</span>
                  <input
                    type="number"
                    id="monthlyPrice"
                    name="monthlyPrice"
                    required
                    defaultValue={initialData?.monthlyPrice}
                    placeholder="EX: 50000000"
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                  />
                </div>
              </div>

              {isEdit && (
                <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                  <input 
                    type="checkbox" 
                    id="isActive" 
                    name="isActive" 
                    defaultChecked={initialData.isActive}
                    className="w-5 h-5 text-indigo-600 rounded-lg border-slate-300 dark:border-slate-800 focus:ring-indigo-500 dark:bg-slate-900"
                  />
                  <label htmlFor="isActive" className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Currently Active
                  </label>
                </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                   <X className="w-4 h-4 shrink-0" />
                   {error}
                </div>
              )}

              <div className="pt-4 flex items-center justify-between">
                {isEdit ? (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={pending}
                    className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-2xl transition-all active:scale-90"
                    title="Delete Package"
                  >
                    <Trash2 className="w-5.5 h-5.5" />
                  </button>
                ) : <div />}
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pending}
                    className="px-8 py-3 text-sm font-black uppercase tracking-widest text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 transition-all disabled:opacity-50 active:scale-95"
                  >
                    {pending ? "Processing..." : "Save Premium Package"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

