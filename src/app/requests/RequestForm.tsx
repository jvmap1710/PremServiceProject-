"use client";

import { useState, useEffect } from "react";
import { PlusCircle, X, Edit2, Calendar as CalendarIcon, Info, Trash2, Plus, Minus, Clock, AlertTriangle, CheckSquare, Square, ShieldAlert } from "lucide-react";
import { createServiceRequest, updateServiceRequest } from "@/actions/request";
import { getPackageUsage } from "@/actions/package";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { calculatePriorityMatrix, cn } from "@/lib/utils";

const normalizeSlaPriority = (priority: string): string => {
  const p = (priority || "").toUpperCase();
  if (["P1", "P2", "P3", "P4"].includes(p)) return p;
  if (["HIGHEST", "URGENT"].includes(p)) return "P1";
  if (["HIGH"].includes(p)) return "P2";
  if (["MEDIUM"].includes(p)) return "P3";
  if (["LOW", "LOWEST"].includes(p)) return "P4";
  return "P4";
};

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
  const [type, setType] = useState(initialData?.type || "INCIDENT");
  const [raiseDate, setRaiseDate] = useState(
    initialData?.raiseDate
      ? new Date(initialData.raiseDate).toISOString().split("T")[0]
      : new Date().toISOString().split("T")[0]
  );
  const [assigneeId, setAssigneeId] = useState(initialData?.assigneeId || "");
  const [assigneeIds, setAssigneeIds] = useState(initialData?.assigneeIds || initialData?.assigneeId || "");
  const [isOpenAssigneeDropdown, setIsOpenAssigneeDropdown] = useState(false);
  const [priority, setPriority] = useState(normalizeSlaPriority(initialData?.priority || "P4"));
  const [taskPriority, setTaskPriority] = useState(initialData?.taskPriority || "MEDIUM");
  const [urgency, setUrgency] = useState(initialData?.urgency || "");
  const [impact, setImpact] = useState(initialData?.impact || "");

  const isEdit = !!initialData;

  // Reset when opening the modal

  useEffect(() => {
    if (isOpen) {
      setSelectedClientId(initialData?.clientId || "");
      setSelectedPackageId(initialData?.packageId || "");
      setSroItems(initialData?.items?.map((i: any) => ({ sroRuleId: i.sroRuleId, quantity: i.quantity ?? 1 })) || []);
      setTitle(initialData?.title || "");
      setUserRequirement(initialData?.userRequirement || "");
      setDescription(initialData?.description || "");
      setStatus(initialData?.status || "TODO");
      setType(initialData?.type || "INCIDENT");
      setRaiseDate(
        initialData?.raiseDate
          ? new Date(initialData.raiseDate).toISOString().split("T")[0]
          : new Date().toISOString().split("T")[0]
      );
      setAssigneeId(initialData?.assigneeId || "");
      setAssigneeIds(initialData?.assigneeIds || initialData?.assigneeId || "");
      setIsOpenAssigneeDropdown(false);
      setPriority(normalizeSlaPriority(initialData?.priority || "P4"));
      setTaskPriority(initialData?.taskPriority || "MEDIUM");
      setUrgency(initialData?.urgency || "");
      setImpact(initialData?.impact || "");
      setError(null);
    }
  }, [isOpen, initialData]);

  // Auto-reset Urgency & Impact when changing type from Incident / Problem
  useEffect(() => {
    if (type !== "INCIDENT" && type !== "PROBLEM") {
      setUrgency("");
      setImpact("");
      setPriority("P4");
    }
  }, [type]);

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

  // Add SRO item
  const addSroItem = (ruleId: string) => {
    setSroItems((prev) => [...prev, { sroRuleId: ruleId, quantity: 1 }]);
  };

  // Remove an SRO item
  const removeSroItem = (index: number) => {
    setSroItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Change quantity
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
      toast.error("Please select a client.");
      return;
    }
    if (!selectedPackageId) {
      toast.error("Please select a Premium package.");
      return;
    }
    if (!title.trim()) {
      toast.error("Please enter a request title.");
      return;
    }
    if (!description.trim() && session?.user?.role !== "TAS") {
      toast.error("Please enter technical details description.");
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
    formData.append("assigneeIds", assigneeIds);
    formData.append("priority", priority);
    formData.append("taskPriority", taskPriority);
    formData.append("urgency", urgency);
    formData.append("impact", impact);
    formData.append("sroItems", JSON.stringify(sroItems));

    const result = initialData
      ? await updateServiceRequest(initialData.id, formData)
      : await createServiceRequest(formData);

    if (result?.error) {
      toast.error(result.error);
    } else {
      toast.success(isEdit ? "Request updated successfully" : "New request created successfully");
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
          Edit
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl font-black transition-all flex items-center gap-2 text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95"

        >
          <PlusCircle className="w-4 h-4" />
          Create Request
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            {/* Header */}
            <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3 tracking-tight">
                {isEdit ? <Edit2 className="w-6 h-6 text-indigo-600 dark:text-indigo-400" /> : <PlusCircle className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />}
                {isEdit ? "Edit Request" : "Receive New Request"}
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
                      <span className="text-[10px] font-bold uppercase tracking-widest">Profitability Control</span>
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${isOverQuota ? "bg-red-600 text-white" : "bg-indigo-600 text-white"}`}>
                      {usagePercentage}% Quota
                    </span>

                  </div>
                  <p className="text-xs font-bold leading-relaxed">
                    {isOverQuota 
                      ? `⚠️ WARNING: Client has exceeded/is about to exceed quota (${currentTotalWithNewRequest}/${usageStats.monthlyQuota} hours). This request might lead to a loss or require an additional Over-request fee.`
                      : `Info: Quota used this month: ${usageStats.usedHours}h. Projected after this request: ${currentTotalWithNewRequest}/${usageStats.monthlyQuota}h.`
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

              {/* Row 1: Client + Date + Type */}
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Select Client</label>

                  <select
                    value={selectedClientId}
                    onChange={(e) => { setSelectedClientId(e.target.value); setSelectedPackageId(""); setSroItems([]); }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 disabled:opacity-50 shadow-inner"
                  >
                    <option value="">-- Select Client --</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.owner ? `(Owner: ${c.owner.name})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Requested Date</label>
                  <input
                    type="date"
                    value={raiseDate}
                    onChange={(e) => setRaiseDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Request Type</label>

                  <select
                    value={type}
                    onChange={(e) => {
                      const val = e.target.value;
                      setType(val);
                      if (val !== "INCIDENT" && val !== "PROBLEM") {
                        setPriority("P4");
                      }
                    }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                  >
                    <option value="INCIDENT">Incident</option>
                    <option value="PROBLEM">Problem</option>
                    <option value="SRO">SRO</option>
                    <option value="NSRO">NSRO</option>
                    <option value="HEALTH_CHECK">Health Check</option>
                    <option value="OTHERS">Others</option>
                  </select>
                </div>
              </div>

              {/* Conditional Row for Incident / Problem: Urgency + Impact */}
              {(type === "INCIDENT" || type === "PROBLEM") && (
                <div className="grid grid-cols-2 gap-8 p-4 bg-slate-50/50 dark:bg-slate-950/30 rounded-2xl border border-slate-100 dark:border-slate-800/50 animate-in slide-in-from-top-4 duration-200">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Urgency</label>
                    <select
                      value={urgency}
                      onChange={(e) => {
                        const val = e.target.value;
                        setUrgency(val);
                        const autoPrio = calculatePriorityMatrix(val, impact);
                        if (autoPrio) setPriority(autoPrio);
                      }}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                    >
                      <option value="">-- Choose Urgency --</option>
                      <option value="IMMEDIATE">Immediate</option>
                      <option value="URGENT">Urgent</option>
                      <option value="MODERATE">Moderate</option>
                      <option value="STANDARD">Standard</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Impact</label>
                    <select
                      value={impact}
                      onChange={(e) => {
                        const val = e.target.value;
                        setImpact(val);
                        const autoPrio = calculatePriorityMatrix(urgency, val);
                        if (autoPrio) setPriority(autoPrio);
                      }}
                      className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                    >
                      <option value="">-- Choose Impact --</option>
                      <option value="WIDESPREAD">Widespread</option>
                      <option value="LARGE">Large</option>
                      <option value="LIMITED">Limited</option>
                      <option value="LOCALISED">Localised</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Row: Assignee + Priority */}
              <div className={cn(
                "grid gap-8 grid-cols-1",
                (type === "INCIDENT" || type === "PROBLEM") ? "md:grid-cols-2" : "md:grid-cols-3"
              )}>
                <div className="space-y-2 relative">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Assignees</label>
                  <button
                    type="button"
                    onClick={() => setIsOpenAssigneeDropdown(!isOpenAssigneeDropdown)}
                    className="flex items-center justify-between w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner text-left hover:bg-slate-100 dark:hover:bg-slate-900"
                  >
                    <span className="whitespace-normal break-words flex-1 pr-2">
                      {(() => {
                        const selectedList = (assigneeIds || "").split(",").map((id: string) => id.trim()).filter(Boolean);
                        if (selectedList.length === 0) return "-- Unassigned --";
                        return selectedList.map((id: string) => users.find((u: any) => u.id === id)?.name || id).join(", ");
                      })()}
                    </span>
                    <span className="text-slate-400 text-xs shrink-0">▼</span>
                  </button>

                  {isOpenAssigneeDropdown && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setIsOpenAssigneeDropdown(false)}
                      />
                      <div className="absolute left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-20 max-h-60 overflow-y-auto p-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
                        {users.map((u: any) => {
                          const selectedList = (assigneeIds || "").split(",").map((id: string) => id.trim()).filter(Boolean);
                          const isChecked = selectedList.includes(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              onClick={() => {
                                let newList: string[];
                                if (isChecked) {
                                  newList = selectedList.filter((id: string) => id !== u.id);
                                } else {
                                  newList = [...selectedList, u.id];
                                }
                                const idsString = newList.join(",");
                                setAssigneeIds(idsString);
                                setAssigneeId(newList.length > 0 ? newList[0] : "");
                              }}
                              className={`flex items-center gap-3 w-full p-2.5 rounded-xl transition-all text-left hover:bg-slate-50 dark:hover:bg-slate-800/50 ${isChecked ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''}`}
                            >
                              {isChecked ? (
                                <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                              ) : (
                                <Square className="w-4 h-4 text-slate-300 dark:text-slate-700 flex-shrink-0" />
                              )}
                              <div className="flex flex-col">
                                <span className={`text-xs font-bold ${isChecked ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {u.name}
                                </span>
                                <span className="text-[9px] text-slate-400 font-medium">
                                  {u.role}
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <label className={cn(
                    "text-[10px] font-bold uppercase tracking-widest block px-1 transition-all duration-300",
                    priority === "P1" ? "text-rose-700 dark:text-rose-400" :
                    priority === "P2" ? "text-orange-700 dark:text-orange-400" :
                    priority === "P3" ? "text-blue-700 dark:text-blue-400" :
                    "text-slate-500 dark:text-slate-400"
                  )}>
                    SLA Priority
                  </label>
                  <div className={cn(
                    "grid grid-cols-4 gap-1.5 p-1.5 rounded-2xl border transition-all duration-300 h-[46px] items-center",
                    priority === "P1" ? "bg-rose-50/30 border-rose-100 dark:bg-rose-950/5 dark:border-rose-900/20" :
                    priority === "P2" ? "bg-orange-50/30 border-orange-100 dark:bg-orange-950/5 dark:border-orange-900/20" :
                    priority === "P3" ? "bg-blue-50/30 border-blue-100 dark:bg-blue-950/5 dark:border-blue-900/20" :
                    "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800"
                  )}>
                    {["P1", "P2", "P3", "P4"].map((p) => {
                      const isActive = priority === p;
                      const colors = {
                        P1: "bg-rose-600 text-white ring-rose-200 dark:ring-rose-900/30 hover:bg-rose-700",
                        P2: "bg-orange-500 text-white ring-orange-200 dark:ring-orange-900/30 hover:bg-orange-600",
                        P3: "bg-blue-600 text-white ring-blue-200 dark:ring-blue-900/30 hover:bg-blue-700",
                        P4: "bg-slate-600 text-white ring-slate-200 dark:ring-slate-900/30 hover:bg-slate-700",
                      }[p as "P1" | "P2" | "P3" | "P4"];
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => setPriority(p)}
                          className={cn(
                            "py-1.5 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all",
                            isActive 
                              ? cn("shadow-sm ring-2", colors) 
                              : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-white dark:hover:bg-slate-905"
                          )}
                        >
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {type !== "INCIDENT" && type !== "PROBLEM" && (
                  <div className="space-y-2">
                    <label className={cn(
                      "text-[10px] font-bold uppercase tracking-widest block px-1 transition-all duration-300",
                      taskPriority === "HIGHEST" ? "text-rose-700 dark:text-rose-400" :
                      taskPriority === "HIGH" ? "text-orange-700 dark:text-orange-400" :
                      taskPriority === "MEDIUM" ? "text-amber-700 dark:text-amber-400" :
                      taskPriority === "LOW" ? "text-blue-700 dark:text-blue-400" :
                      "text-slate-500 dark:text-slate-400"
                    )}>
                      Ticket Priority
                    </label>
                    <div className={cn(
                      "flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 shadow-inner",
                      taskPriority === "HIGHEST" ? "bg-rose-50/50 border-rose-100 dark:bg-rose-950/20 dark:border-rose-900/30" :
                      taskPriority === "HIGH" ? "bg-orange-50/50 border-orange-100 dark:bg-orange-950/20 dark:border-orange-900/30" :
                      taskPriority === "MEDIUM" ? "bg-amber-50/50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30" :
                      taskPriority === "LOW" ? "bg-blue-50/50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30" :
                      "bg-slate-50 border-slate-200 dark:bg-slate-950 dark:border-slate-800"
                    )}>
                      <ShieldAlert className={cn(
                        "w-5 h-5 transition-colors duration-300",
                        taskPriority === "HIGHEST" ? "text-rose-500" :
                        taskPriority === "HIGH" ? "text-orange-500" :
                        taskPriority === "MEDIUM" ? "text-amber-500" :
                        taskPriority === "LOW" ? "text-blue-500" :
                        "text-slate-400"
                      )} />
                      <select
                        value={taskPriority}
                        onChange={(e) => setTaskPriority(e.target.value)}
                        className={cn(
                          "bg-transparent text-sm font-bold outline-none w-full cursor-pointer transition-colors duration-300",
                          taskPriority === "HIGHEST" ? "text-rose-700 dark:text-rose-300" :
                          taskPriority === "HIGH" ? "text-orange-700 dark:text-orange-300" :
                          taskPriority === "MEDIUM" ? "text-amber-700 dark:text-amber-300" :
                          taskPriority === "LOW" ? "text-blue-700 dark:text-blue-300" :
                          "text-slate-700 dark:text-slate-200"
                        )}
                      >
                        <option value="HIGHEST" className="bg-white dark:bg-slate-900 text-rose-700">Highest</option>
                        <option value="HIGH" className="bg-white dark:bg-slate-900 text-orange-700">High</option>
                        <option value="MEDIUM" className="bg-white dark:bg-slate-900 text-amber-700">Medium</option>
                        <option value="LOW" className="bg-white dark:bg-slate-900 text-blue-700">Low</option>
                        <option value="LOWEST" className="bg-white dark:bg-slate-900 text-slate-700">Lowest</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Package select */}
              {selectedClient && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Select active Premium Package</label>

                  <select
                    value={selectedPackageId}
                    onChange={(e) => { setSelectedPackageId(e.target.value); setSroItems([]); }}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                  >
                    <option value="">-- Select Premium Package --</option>
                    {availablePackages.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.isActive ? "(Active)" : "(Expired)"}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <hr className="border-slate-100 dark:border-slate-800" />

              {/* Title */}
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Short Title</label>

                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Home page UI bug, Report export request..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                />
              </div>

              {/* User requirement + technical description */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Client Description</label>

                  <textarea
                    value={userRequirement}
                    onChange={(e) => setUserRequirement(e.target.value)}
                    placeholder="Original request description from client..."
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-medium text-slate-600 dark:text-slate-400 resize-none h-32 shadow-inner"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">
                    Technical Solution Details {session?.user?.role === "TAS" && <span className="text-slate-300 dark:text-slate-600 font-normal normal-case ml-1">(Optional for TAS)</span>}
                  </label>

                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Detailed technical tasks to be processed..."
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-medium text-slate-600 dark:text-slate-400 resize-none h-32 shadow-inner"
                  />
                </div>
              </div>

              {/* ====== SRO SECTION ====== */}
              {selectedPackage && (
                <div className="space-y-6 bg-slate-50 dark:bg-slate-950/30 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-inner">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                      Standard Request (SRO) Category {session?.user?.role === "TAS" && <span className="text-slate-300 dark:text-slate-600 font-normal normal-case ml-1">(Optional for TAS)</span>}
                    </label>

                    {totalEstimatedHours > 0 && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-indigo-500" />
                        <span className="text-xs text-indigo-700 dark:text-indigo-400 font-bold tracking-tight">
                          ~{totalEstimatedHours}h estimated
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
                      <option value="">+ Add SRO category for this request...</option>
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
                            <div className={`flex items-center gap-3 rounded-2xl px-4 py-3 border shadow-sm transition-all ${
                              isOverRuleLimit 
                                ? "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/30" 
                                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800"
                            }`}>
                              <div className="flex-1 flex flex-col min-w-0">
                                <span className={`text-xs font-black tracking-tight leading-relaxed break-words ${isOverRuleLimit ? "text-red-700 dark:text-red-400" : "text-slate-700 dark:text-slate-200"}`}>
                                  {rule?.taskName || item.sroRuleId}
                                </span>
                                {rule && (
                                  <div className="flex flex-col gap-0.5 mt-1">
                                    <span className="text-[9px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                                      Standard Estimate: {rule.estimateHours}h/SRO
                                    </span>
                                    <span className={`text-[9px] font-bold uppercase tracking-wider ${isOverRuleLimit ? "text-red-500" : "text-slate-400"}`}>
                                      Limit: {totalUsageForRule}/{rule.requestsPerMonth} (This month)
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-100 dark:border-slate-700 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(idx, -1)}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 flex items-center justify-center transition-all text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 shadow-sm active:scale-90"
                                >
                                  <Minus className="w-3.5 h-3.5" />
                                </button>
                                <span className="w-7 text-center text-xs font-black text-slate-900 dark:text-slate-100">{item.quantity}</span>
                                <button
                                  type="button"
                                  onClick={() => updateQuantity(idx, 1)}
                                  className="w-7 h-7 rounded-lg bg-white dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 flex items-center justify-center transition-all text-slate-400 dark:text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 shadow-sm active:scale-90"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeSroItem(idx)}
                                className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg transition-all shrink-0"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                            {isOverRuleLimit && (
                              <p className="text-[9px] font-black text-red-600 uppercase tracking-widest px-4">
                                ⚠️ Standard request limit exceeded for this category
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[28px] bg-white/50 dark:bg-slate-950/50">
                       <p className="text-xs text-slate-400 dark:text-slate-500 font-bold italic uppercase tracking-widest">Select an SRO category from the dropdown above to calculate quota.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Status (edit mode only) */}
              {isEdit && (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block px-1">Processing Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:bg-white dark:focus:bg-slate-800 outline-none transition-all font-bold text-slate-700 dark:text-slate-200 shadow-inner"
                  >
                    <option value="TODO">🆕 Received</option>
                    <option value="IN_PROGRESS">⚡ In Progress</option>
                    <option value="DONE">✅ Completed</option>
                    <option value="PAUSED">⏸️ On Hold</option>
                    <option value="CLOSED">🔒 Closed</option>
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
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={pending}
                  className="px-10 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-black uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 active:scale-95"
                >
                  {pending ? "Processing..." : "Save Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
