"use client";

import { useState, useEffect } from "react";
import { PlusCircle, X, Edit2, Calendar as CalendarIcon, Info, Trash2, Plus, Minus, Clock, AlertTriangle } from "lucide-react";
import { createServiceRequest, updateServiceRequest } from "@/actions/request";
import { getPackageUsage } from "@/actions/package";
import { useSession } from "next-auth/react";

type SRORule = { id: string; taskName: string; estimateHours: number; requestsPerMonth: number };

type ClientWithRules = {
  id: string;
  name: string;
  ownerId?: string;
  owner?: { name: string };
  packages: {
    id: string;
    name: string;
    isActive: boolean;
    sroRules: SRORule[];
  }[];
};



type SROItem = { sroRuleId: string; quantity: number };

interface RequestFormProps {
  clients: ClientWithRules[];
  users?: { id: string; name: string; role: string }[];
  initialData?: any;
  onClose?: () => void;
  autoOpen?: boolean;
}

export function RequestForm({ clients, users = [], initialData, onClose, autoOpen = false }: RequestFormProps) {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(autoOpen);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedClientId, setSelectedClientId] = useState(initialData?.clientId || "");
  const [selectedPackageId, setSelectedPackageId] = useState(initialData?.packageId || "");
  
  // Profitability Safeguard state
  const [usageStats, setUsageStats] = useState<{ usedHours: number; monthlyQuota: number; ruleUsage: Record<string, number> } | null>(null);
  const [isUsageLoading, setIsUsageLoading] = useState(false);

  // SRO items list: [{ sroRuleId, quantity }]
  const [sroItems, setSroItems] = useState<SROItem[]>(
    initialData?.items?.map((i: any) => ({ sroRuleId: i.sroRuleId, quantity: i.quantity ?? 1 })) || []
  );

  const [title, setTitle] = useState(initialData?.title || "");
  const [userRequirement, setUserRequirement] = useState(initialData?.userRequirement || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [status, setStatus] = useState(initialData?.status || "TODO");
  const [type, setType] = useState(initialData?.type || "TASK");
  const [raiseDate, setRaiseDate] = useState(
    initialData?.raiseDate
      ? new Date(initialData.raiseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId || "");

  const isEdit = !!initialData;

  // Reset khi mở modal

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId(initialData?.clientId || "");
      setSelectedPackageId(initialData?.packageId || "");
      setSroItems(initialData?.items?.map((i: any) => ({ sroRuleId: i.sroRuleId, quantity: i.quantity ?? 1 })) || []);
      setTitle(initialData?.title || "");
      setUserRequirement(initialData?.userRequirement || "");
      setDescription(initialData?.description || "");
      setStatus(initialData?.status || "TODO");
      setType(initialData?.type || "TASK");
      setRaiseDate(
        initialData?.raiseDate
          ? new Date(initialData.raiseDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setAssigneeId(initialData?.assigneeId || "");
      setError(null);
    }
  }, [isOpen, initialData]);

  useEffect(() => {
    if (autoOpen) setIsOpen(true);
  }, [autoOpen]);

  // Auto-select Client for TAS
  useEffect(() => {
    if (isOpen && !isEdit && session?.user?.id) {
      const ownedClients = clients.filter(c => c.ownerId === session.user?.id);
      if (ownedClients.length === 1) {
        setSelectedClientId(ownedClients[0].id);
      }
    }
  }, [isOpen, isEdit, session?.user?.id, clients]);

  // Auto-select active package when client changes
  useEffect(() => {
    if (selectedClientId && !isEdit) {
      const client = clients.find(c => c.id === selectedClientId);
      const activePackage = client?.packages?.find(p => p.isActive);
      if (activePackage) {
        setSelectedPackageId(activePackage.id);
      }
    }
  }, [selectedClientId, isEdit, clients]);


  // Story 3.4: Fetch monthly usage when package changes
  useEffect(() => {
    async function fetchUsage() {
      if (selectedPackageId) {
        setIsUsageLoading(true);
        const result = await getPackageUsage(selectedPackageId);
        if (result && !("error" in result)) {
          setUsageStats({ 
            usedHours: result.usedHours || 0, 
            monthlyQuota: result.monthlyQuota || 0,
            ruleUsage: result.ruleUsage || {}
          });
        }
        setIsUsageLoading(false);
      } else {
        setUsageStats(null);
      }
    }
    fetchUsage();
  }, [selectedPackageId]);

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const availablePackages = selectedClient?.packages || [];
  const selectedPackage = availablePackages.find((p) => p.id === selectedPackageId);
  const availableRules = selectedPackage?.sroRules || [];

  // Thêm SRO vào danh sách
  const addSroItem = (ruleId: string) => {
    setSroItems((prev) => [...prev, { sroRuleId: ruleId, quantity: 1 }]);
  };

  // Xóa một dòng SRO
  const removeSroItem = (index: number) => {
    setSroItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Thay đổi số lượng
  const updateQuantity = (index: number, delta: number) => {
    setSroItems((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: Math.max(1, item.quantity + delta) } : item
      )
    );
  };

  const getRuleName = (ruleId: string) =>
    availableRules.find((r) => r.id === ruleId)?.taskName || ruleId;

  const totalEstimatedHours = sroItems.reduce((sum, item) => {
    const rule = availableRules.find((r) => r.id === item.sroRuleId);
    return sum + (rule?.estimateHours || 0) * item.quantity;
  }, 0);

  // Profitability Safeguard Logic
  const currentTotalWithNewRequest = (usageStats?.usedHours || 0) + totalEstimatedHours;
  const isOverQuota = usageStats && usageStats.monthlyQuota > 0 && currentTotalWithNewRequest > usageStats.monthlyQuota;
  const usagePercentage = usageStats && usageStats.monthlyQuota > 0 
    ? Math.round((currentTotalWithNewRequest / usageStats.monthlyQuota) * 100) 
    : 0;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!selectedClientId) {
      setError("Vui lòng chọn khách hàng.");
      return;
    }
    if (!selectedPackageId) {
      setError("Vui lòng chọn gói Premium.");
      return;
    }
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề yêu cầu.");
      return;
    }
    if (!description.trim()) {
      setError("Vui lòng nhập chi tiết mô tả kỹ thuật.");
      return;
    }

    setPending(true);
    const formData = new FormData();
    formData.append("clientId", selectedClientId);
    formData.append("packageId", selectedPackageId);
    formData.append("title", title);
    formData.append("userRequirement", userRequirement);
    formData.append("description", description);
    formData.append("status", status);
    formData.append("type", type);
    formData.append("raiseDate", raiseDate);
    formData.append("assigneeId", assigneeId);
    formData.append("sroItems", JSON.stringify(sroItems));

    const result = initialData
      ? await updateServiceRequest(initialData.id, formData)
      : await createServiceRequest(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      handleClose();
    }
    setPending(false);
  }

  return (

    <>
      {isEdit ? (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 transition-all font-bold text-sm shadow-sm bg-white dark:bg-slate-800/50"
        >
          <Edit2 className="w-4 h-4" />
          Chỉnh sửa
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95"

        >
          <PlusCircle className="w-4 h-4" />
          Tạo yêu cầu mới
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight">
                {isEdit ? <Edit2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> : <PlusCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                {isEdit ? "Chỉnh sửa yêu cầu" : "Tiếp nhận yêu cầu mới"}
              </h2>

              <button onClick={handleClose} className="p-2 text-slate-400 hover:bg-white dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-8 overflow-y-auto space-y-8 scrollbar-hide">
              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-2xl text-xs font-bold border border-red-100 dark:border-red-800 flex items-center gap-3 animate-in shake duration-300">
                  <Info className="w-4 h-4 shrink-0" /> {error}
                </div>
              )}

              {/* Story 3.4: Profitability Safeguard Warning */}
              {selectedPackageId && usageStats && (
                <div className={`p-6 rounded-[28px] border transition-all ${
                  isOverQuota 
                    ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300" 
                    : "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-100 dark:border-indigo-900/30 text-indigo-800 dark:text-indigo-300"
                }`}>
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      {isOverQuota ? <AlertTriangle className="w-4 h-4 text-red-600 animate-bounce" /> : <Info className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />}
                      <span className="text-[10px] font-bold uppercase tracking-widest">Kiểm soát lợi nhuận (Profitability)</span>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isOverQuota ? "bg-red-600 text-white" : "bg-indigo-600 text-white"}`}>
                      {usagePercentage}% Quota
                    </span>

                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    {isOverQuota 
                      ? `⚠️ CẢNH BÁO: Khách hàng đã/sắp vượt định mức (${currentTotalWithNewRequest}/${usageStats.monthlyQuota} giờ). Yêu cầu này có thể gây lỗ hoặc cần tính thêm phí Over-request.`
                      : `Thông tin: Quota tháng này đã sử dụng ${usageStats.usedHours}h. Dự kiến sau request này: ${currentTotalWithNewRequest}/${usageStats.monthlyQuota}h.`
                    }
                  </p>
                  <div className="mt-4 h-2 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-700 ease-out ${isOverQuota ? "bg-red-500" : "bg-indigo-500"}`} 
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Row 1: Client + Date */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Chọn khách hàng</label>

                  <select
                    disabled={isEdit}
                    value={selectedClientId}
                    onChange={(e) => { setSelectedClientId(e.target.value); setSelectedPackageId(""); setSroItems([]); }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 shadow-inner"
                  >
                    <option value="">-- Chọn khách hàng --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.owner ? `(Owner: ${c.owner.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>


                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Loại yêu cầu</label>

                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                  >
                    <option value="TASK">📋 TASK (Công việc)</option>
                    <option value="BUG">🐞 BUG (Lỗi hệ thống)</option>
                    <option value="FEATURE">🚀 FEATURE (Tính năng)</option>
                    <option value="URGENT">⚠️ URGENT (Khẩn cấp)</option>
                  </select>
                </div>
              </div>

              {/* Assignee selection */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Người xử lý (Assignee)</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                >
                  <option value="">-- Chưa phân công --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              {/* Package select */}
              {selectedClient && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Chọn gói Premium đang áp dụng</label>

                  <select
                    disabled={isEdit}
                    value={selectedPackageId}
                    onChange={(e) => { setSelectedPackageId(e.target.value); setSroItems([]); }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 shadow-inner"
                  >
                    <option value="">-- Chọn gói Premium --</option>
                    {availablePackages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isActive ? "(Đang hoạt động)" : "(Hết hạn)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Tiêu đề ngắn gọn</label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Lỗi giao diện trang chủ, Yêu cầu xuất báo cáo..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                />
              </div>

              {/* User requirement + technical description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Mô tả từ khách hàng</label>

                  <textarea
                    value={userRequirement}
                    onChange={(e) => setUserRequirement(e.target.value)}
                    placeholder="Mô tả nguyên văn yêu cầu của KH..."
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-medium text-slate-600 dark:text-slate-400 resize-none h-32 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Chi tiết giải pháp</label>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Chi tiết công việc cần xử lý..."
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-medium text-slate-600 dark:text-slate-400 resize-none h-32 shadow-inner"
                  />
                </div>
              </div>

              {/* ====== SRO SECTION ====== */}
              {selectedPackage && (
                <div className="space-y-6 bg-slate-50 dark:bg-slate-950/30 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-inner">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Danh mục Standard Request (SRO)</label>

                    {totalEstimatedHours > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs text-indigo-700 dark:text-indigo-400 font-bold tracking-tight">
                          ~{totalEstimatedHours}h dự kiến
                        </span>

                      </div>
                    )}
                  </div>

                  {/* Dropdown to add SRO */}
                  <div className="relative">
                    <select
                      className="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 dark:focus:border-indigo-800 outline-none transition-all font-bold text-slate-600 dark:text-slate-400 appearance-none shadow-sm"
                      defaultValue=""
                      onChange={(e) => {
                        if (e.target.value) {
                          addSroItem(e.target.value);
                          e.target.value = "";
                        }
                      }}
                    >
                      <option value="">+ Thêm danh mục SRO áp dụng cho yêu cầu này...</option>
                      {availableRules.map((rule) => (
                        <option key={rule.id} value={rule.id}>
                          {rule.taskName} ({rule.estimateHours}h / req)
                        </option>
                      ))}
                    </select>
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                  </div>

                  {/* SRO items list */}
                  {sroItems.length > 0 ? (
                    <div className="space-y-3">
                      {sroItems.map((item, idx) => {
                        const rule = availableRules.find(r => r.id === item.sroRuleId);
                        const prevUsage = usageStats?.ruleUsage?.[item.sroRuleId] || 0;
                        const otherItemsSameRuleCount = sroItems
                          .filter((_, i) => i !== idx && _.sroRuleId === item.sroRuleId)
                          .reduce((sum, it) => sum + it.quantity, 0);
                        
                        const totalUsageForRule = prevUsage + otherItemsSameRuleCount + item.quantity;
                        const isOverRuleLimit = rule && totalUsageForRule > rule.requestsPerMonth;

                        return (
                          <div key={idx} className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                            <div className={`flex items-center gap-4 rounded-[24px] px-5 py-4 border shadow-sm transition-all ${
                              isOverRuleLimit 
                                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30" 
                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                            }`}>
                              <div className="flex-1 flex flex-col overflow-hidden">
                                <span className={`text-sm font-black truncate tracking-tight ${isOverRuleLimit ? "text-red-700 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}`}>
                                  {rule?.taskName || item.sroRuleId}
                                </span>
                                {rule && (
                                  <span className={`text-[10px] font-bold ${isOverRuleLimit ? "text-red-500" : "text-slate-400"}`}>
                                    Hạn mức: {totalUsageForRule}/{rule.requestsPerMonth} (Tháng này)
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(idx, -1)}
                                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center transition-all text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm active:scale-90"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-10 text-center text-sm font-black text-slate-900 dark:text-slate-100">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(idx, 1)}
                                  className="w-9 h-9 rounded-xl bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center justify-center transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm active:scale-90"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSroItem(idx)}
                                className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                            {isOverRuleLimit && (
                              <p className="text-[9px] font-black text-red-600 uppercase tracking-widest px-4">
                                ⚠️ Vượt định mức số lần yêu cầu cho hạng mục này
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[28px] bg-white/50 dark:bg-slate-950/50">
                       <p className="text-xs text-slate-400 dark:text-slate-500 font-bold italic uppercase tracking-widest">Chọn loại SRO từ danh sách bên trên để tính quota.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status (edit mode only) */}
              {isEdit && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Trạng thái xử lý</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                  >
                    <option value="TODO">🆕 Cần làm (TODO)</option>
                    <option value="IN_PROGRESS">⚡ Đang xử lý (IN PROGRESS)</option>
                    <option value="DONE">✅ Hoàn thành (DONE)</option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-4 pt-8 border-t border-slate-100 dark:border-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-8 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-95"
                >
                  {pending ? "Đang xử lý..." : "Lưu yêu cầu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
