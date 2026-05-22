"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { addSRORule, updateSRORule } from "@/actions/package";
import { Plus, X, Edit2, Shield, Settings } from "lucide-react";
import { STANDARD_REQUESTS } from "@/lib/standard-requests";

interface RuleFormProps {
  packageId: string;
  initialData?: {
    id: string;
    taskName: string;
    scope?: string | null;
    exclusions?: string | null;
    estimateHours: number;
    requestsPerMonth: number;
    notes?: string | null;
  };
}

export function RuleForm({ packageId, initialData }: RuleFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // State to hold selected template data
  const [selectedTask, setSelectedTask] = useState("");
  const [customTaskName, setCustomTaskName] = useState("");
  const [scope, setScope] = useState("");
  const [exclusions, setExclusions] = useState("");
  const [estimateHours, setEstimateHours] = useState<number | "">("");
  const [requestsPerMonth, setRequestsPerMonth] = useState<number | "">("");
  const [notes, setNotes] = useState("");

  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // Populate form if initialData is provided
  useEffect(() => {
    if (initialData && isOpen) {
      const isTemplate = STANDARD_REQUESTS.some(r => r.taskName === initialData.taskName);
      setSelectedTask(isTemplate ? initialData.taskName : "other");
      if (!isTemplate) setCustomTaskName(initialData.taskName || "");
      setScope(initialData.scope || "");
      setExclusions(initialData.exclusions || "");
      setEstimateHours(initialData.estimateHours ?? "");
      setRequestsPerMonth(initialData.requestsPerMonth ?? "");
      setNotes(initialData.notes || "");
    }
  }, [initialData, isOpen]);

  function handleTaskSelect(e: React.ChangeEvent<HTMLSelectElement>) {
    const val = e.target.value;
    setSelectedTask(val);
    
    if (val && val !== "other") {
      const template = STANDARD_REQUESTS.find(r => r.taskName === val);
      if (template) {
        setEstimateHours(template.estimateHours);
        setRequestsPerMonth(template.requestsPerMonth);
        setNotes("");
      }
    } else {
      setScope("");
      setExclusions("");
      setEstimateHours("");
      setRequestsPerMonth("");
      setNotes("");
      if (val !== "other") setCustomTaskName("");
    }
  }

  async function handleSubmit(formData: FormData) {
    setError(null);
    setPending(true);
    
    // Validate
    if (selectedTask === "") {
      setError("Please select a Request type");
      setPending(false);
      return;
    }
    if (selectedTask === "other" && !customTaskName.trim()) {
      setError("Please enter a name for the new Request type");
      setPending(false);
      return;
    }

    const finalTaskName = selectedTask === "other" ? customTaskName : selectedTask;

    const newFormData = new FormData();
    newFormData.set("packageId", packageId);
    if (initialData) {
      newFormData.set("id", initialData.id);
    }
    
    newFormData.set("taskName", finalTaskName);
    newFormData.set("scope", scope);
    newFormData.set("exclusions", exclusions);
    newFormData.set("estimateHours", estimateHours.toString());
    newFormData.set("requestsPerMonth", requestsPerMonth.toString());
    newFormData.set("notes", notes);

    const result = initialData 
      ? await updateSRORule(newFormData)
      : await addSRORule(newFormData);
    
    if (result?.error) {
      setError(result.error);
    } else {
      setIsOpen(false);
      if (!initialData) {
        setSelectedTask("");
        setScope("");
        setExclusions("");
        setEstimateHours("");
        setRequestsPerMonth("");
        setCustomTaskName("");
        setNotes("");
      }
    }
    setPending(false);
  }

  return (
    <>
      {initialData ? (
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-xl transition-all active:scale-90"
          title="Edit Category"
        >
          <Edit2 className="w-4 h-4" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="text-xs font-black text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 flex items-center gap-1.5 uppercase tracking-widest transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Declare Request Category
        </button>
      )}

      {isOpen && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between p-8 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 shrink-0">
              <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-3">
                <Shield className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
                {initialData ? "Edit Request Category" : "Declare New Standard Request"}
              </h2>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="overflow-y-auto p-8 scrollbar-hide">
              <form action={handleSubmit} className="space-y-6" id="ruleForm">
                <div className="space-y-1.5">
                  <label htmlFor="taskNameSelect" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Select Standard Request Type (Appendix E)
                  </label>
                  <select
                    id="taskNameSelect"
                    value={selectedTask}
                    onChange={handleTaskSelect}
                    required
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                  >
                    <option value="">-- Select Request Type --</option>
                    {STANDARD_REQUESTS.map(req => (
                      <option key={req.taskName} value={req.taskName}>
                        {req.taskName}
                      </option>
                    ))}
                    <option value="other">Other (Manual Entry)...</option>
                  </select>
                </div>

                {selectedTask === "other" && (
                  <div className="space-y-1.5">
                    <label htmlFor="customTaskName" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                      New Request Type Name
                    </label>
                    <input
                      type="text"
                      id="customTaskName"
                      value={customTaskName}
                      onChange={e => setCustomTaskName(e.target.value)}
                      required
                      placeholder="e.g. Data migration..."
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label htmlFor="estimateHours" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                      Estimated Hours / Request (h)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="estimateHours"
                      value={estimateHours ?? ""}
                      onChange={e => setEstimateHours(parseFloat(e.target.value) || "")}
                      required
                      min="0.01"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label htmlFor="requestsPerMonth" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                      Requests / Month
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      id="requestsPerMonth"
                      value={requestsPerMonth ?? ""}
                      onChange={e => setRequestsPerMonth(parseFloat(e.target.value) || "")}
                      required
                      min="0.01"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-bold text-slate-900 dark:text-slate-100 shadow-inner"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="scope" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Scope of Work
                  </label>
                  <textarea
                    id="scope"
                    value={scope ?? ""}
                    onChange={e => setScope(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-600 dark:text-slate-400 resize-none shadow-inner"
                    placeholder="Describe the specific scope of work..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="exclusions" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Exclusions
                  </label>
                  <textarea
                    id="exclusions"
                    value={exclusions ?? ""}
                    onChange={e => setExclusions(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-600 dark:text-slate-400 resize-none shadow-inner"
                    placeholder="Cases not covered..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="notes" className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest ml-1">
                    Flexible Sales Notes
                  </label>
                  <input
                    type="text"
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-medium text-slate-600 dark:text-slate-400 shadow-inner"
                    placeholder="VD: 1 per quarter, 1 per year,..."
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-2xl border border-red-100 dark:border-red-900/30 flex items-center gap-3">
                    <X className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
              </form>
            </div>
            
            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 shrink-0 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-6 py-3 text-sm font-bold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="ruleForm"
                disabled={pending || selectedTask === ""}
                className="px-8 py-3 text-sm font-black uppercase tracking-widest text-white bg-indigo-600 rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-indigo-900/20 transition-all disabled:opacity-50 active:scale-95"
              >
                {pending ? "Processing..." : "Save Category"}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

