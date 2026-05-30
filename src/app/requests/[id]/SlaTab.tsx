"use client";

import { useState, useTransition, useEffect } from "react";
import {
  Clock, Plus, Trash2,
  RefreshCw, Edit2
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import {
  addSlaLine,
  updateSlaLine,
  deleteSlaLine,
  addSlaUpdateEntry,
  updateSlaUpdateEntry,
  deleteSlaUpdateEntry
} from "@/actions/sla";
import { SlaLineForm } from "./SlaLineForm"; // Ensure this import exists

export interface SlaLineData {
  id: string;
  title: string;
  priority: string;
  ticketType: string;
  ticketRequestDateTime: Date | string | null;
  ackDateTime: Date | string | null;
  actualAckTime: number | null;
  ackSlaTarget: number | null;
  responseDateTime: Date | string | null;
  actualResponseTime: number | null;
  responseSlaTarget: number | null;
  resolutionStatus: string | null;
  completionDateTime: Date | string | null;
  actualCompletionTime: number | null;
  completionSlaTarget: number | null;
}

export interface UpdateFrequencyEntryData {
  id: string;
  customerResponseDateTime: Date | string | null;
  updateDateTime: Date | string | null;
  actualUpdateFrequency: number | null;
  note: string | null;
}

interface SlaTabProps {
  requestId: string;
  slaLines: SlaLineData[];
  isReadOnly?: boolean;
  requestData?: any;
}

function formatDTLocal(dt: Date | string | null): string {
  if (!dt) return "";
  const d = new Date(dt);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${h}:${min}`;
}

function PerformanceBadge({ actual, target }: { actual: number | null; target: number | null }) {
  if (actual === null || actual === undefined || target === null || target === undefined) {
    return <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md uppercase tracking-wider">N/A</span>;
  }
  const met = actual <= target;
  return (
    <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${met ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}>
      {met ? "Met" : "Missed"}
    </span>
  );
}

function SlaLineRow({
  line,
  isReadOnly,
  savingLineId,
  handleAutoSaveLine,
  handleDeleteSlaLine,
  isPending,
  onOpenEditModal,
}: {
  line: SlaLineData;
  isReadOnly?: boolean;
  savingLineId: string | null;
  handleAutoSaveLine: (id: string, data: Partial<SlaLineData>) => Promise<void>;
  handleDeleteSlaLine: (id: string) => Promise<void>;
  isPending: boolean;
  onOpenEditModal: (line: SlaLineData) => void;
}) {
  const isSavingThis = savingLineId === line.id;
  const [title, setTitle] = useState(line.title);
  const [actualAckTime, setActualAckTime] = useState(line.actualAckTime !== null ? String(line.actualAckTime) : "");
  const [actualResponseTime, setActualResponseTime] = useState(line.actualResponseTime !== null ? String(line.actualResponseTime) : "");
  const [actualCompletionTime, setActualCompletionTime] = useState(line.actualCompletionTime !== null ? String(line.actualCompletionTime) : "");
  const [resolutionStatus, setResolutionStatus] = useState(line.resolutionStatus || "");

  useEffect(() => setTitle(line.title), [line.title]);
  useEffect(() => setActualAckTime(line.actualAckTime !== null ? String(line.actualAckTime) : ""), [line.actualAckTime]);
  useEffect(() => setActualResponseTime(line.actualResponseTime !== null ? String(line.actualResponseTime) : ""), [line.actualResponseTime]);
  useEffect(() => setActualCompletionTime(line.actualCompletionTime !== null ? String(line.actualCompletionTime) : ""), [line.actualCompletionTime]);
  useEffect(() => setResolutionStatus(line.resolutionStatus || ""), [line.resolutionStatus]);

  const handleTitleBlur = () => { if (title.trim() !== line.title) handleAutoSaveLine(line.id, { title: title.trim() }); };
  const handleAckTimeBlur = () => { const val = actualAckTime ? parseFloat(actualAckTime) : null; if (val !== line.actualAckTime) handleAutoSaveLine(line.id, { actualAckTime: val }); };
  const handleResponseTimeBlur = () => { const val = actualResponseTime ? parseFloat(actualResponseTime) : null; if (val !== line.actualResponseTime) handleAutoSaveLine(line.id, { actualResponseTime: val }); };
  const handleCompletionTimeBlur = () => { const val = actualCompletionTime ? parseFloat(actualCompletionTime) : null; if (val !== line.actualCompletionTime) handleAutoSaveLine(line.id, { actualCompletionTime: val }); };
  const handleResolutionStatusBlur = () => { if (resolutionStatus.trim() !== (line.resolutionStatus || "")) handleAutoSaveLine(line.id, { resolutionStatus: resolutionStatus.trim() }); };

  const inputClasses = "bg-transparent border-none outline-none focus:ring-2 focus:ring-indigo-500/20 rounded p-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 w-full";

  return (
    <tr className={`group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-200 dark:border-slate-800 ${isSavingThis ? "opacity-70 bg-amber-50 dark:bg-amber-900/10" : ""}`}>
      {/* Form Trigger */}
      <td className="py-3 px-3 align-middle text-center border-r border-slate-200 dark:border-slate-800">
        <button onClick={() => onOpenEditModal(line)} className="p-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 rounded-md transition-all" title="Open Vertical Form Editor">
          <Edit2 className="w-4 h-4" />
        </button>
      </td>

      {/* General */}
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800">
        <div className="relative flex items-center w-full">
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} onBlur={handleTitleBlur} disabled={isReadOnly} className={`${inputClasses} font-bold pr-16`} />
          {isSavingThis && <div className="absolute right-2 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 rounded-full animate-pulse"><RefreshCw className="w-3 h-3 animate-spin text-amber-500" /></div>}
        </div>
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800">
        <select value={line.ticketType} onChange={(e) => handleAutoSaveLine(line.id, { ticketType: e.target.value })} disabled={isReadOnly} className={`${inputClasses} cursor-pointer text-center`}>
          <option value="INCIDENT">Incident</option>
          <option value="PROBLEM">Problem</option>
          <option value="SRO">SR</option>
          <option value="NSRO">NSR</option>
          <option value="OTHERS">Others</option>
          <option value="HEALTH_CHECK">Health Check</option>
        </select>
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800">
        <select value={line.priority} onChange={(e) => handleAutoSaveLine(line.id, { priority: e.target.value })} disabled={isReadOnly} className={`${inputClasses} cursor-pointer text-center font-black`}>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
        </select>
      </td>

      {/* Ack */}
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
        <input type="datetime-local" value={formatDTLocal(line.ticketRequestDateTime)} disabled={true} className={`${inputClasses} cursor-not-allowed opacity-60 text-center`} />
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-900/10">
        <input type="datetime-local" value={formatDTLocal(line.ackDateTime)} onChange={(e) => handleAutoSaveLine(line.id, { ackDateTime: e.target.value })} disabled={isReadOnly} className={`${inputClasses} cursor-pointer text-center border-amber-200 dark:border-amber-800/50 focus:ring-amber-500/50`} />
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-900/10 text-center">
        <div className="flex items-center justify-center gap-2 w-full min-w-[120px]">
          <input type="number" step="0.01" value={actualAckTime} placeholder="Auto" onChange={(e) => setActualAckTime(e.target.value)} onBlur={handleAckTimeBlur} disabled={isReadOnly} className={`${inputClasses} w-16 text-center border-amber-200 dark:border-amber-800/50 focus:ring-amber-500/50`} />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">/ {line.ackSlaTarget !== null ? `${line.ackSlaTarget}h` : "—"}</span>
        </div>
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-900/10 text-center">
        <PerformanceBadge actual={line.actualAckTime} target={line.ackSlaTarget} />
      </td>

      {/* Response */}
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-sky-50/30 dark:bg-sky-900/10">
        <input type="datetime-local" value={formatDTLocal(line.responseDateTime)} onChange={(e) => handleAutoSaveLine(line.id, { responseDateTime: e.target.value })} disabled={isReadOnly} className={`${inputClasses} cursor-pointer text-center border-sky-200 dark:border-sky-800/50 focus:ring-sky-500/50`} />
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-sky-50/30 dark:bg-sky-900/10 text-center">
        <div className="flex items-center justify-center gap-2 w-full min-w-[120px]">
          <input type="number" step="0.01" value={actualResponseTime} placeholder="Auto" onChange={(e) => setActualResponseTime(e.target.value)} onBlur={handleResponseTimeBlur} disabled={isReadOnly} className={`${inputClasses} w-16 text-center border-sky-200 dark:border-sky-800/50 focus:ring-sky-500/50`} />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">/ {line.responseSlaTarget !== null ? `${line.responseSlaTarget}h` : "—"}</span>
        </div>
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-sky-50/30 dark:bg-sky-900/10 text-center">
        <PerformanceBadge actual={line.actualResponseTime} target={line.responseSlaTarget} />
      </td>
      
      {/* Completion */}
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-900/10">
        <input type="datetime-local" value={formatDTLocal(line.completionDateTime)} onChange={(e) => handleAutoSaveLine(line.id, { completionDateTime: e.target.value })} disabled={isReadOnly} className={`${inputClasses} cursor-pointer text-center border-purple-200 dark:border-purple-800/50 focus:ring-purple-500/50`} />
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-900/10 text-center">
        <div className="flex items-center justify-center gap-2 w-full min-w-[120px]">
          <input type="number" step="0.01" value={actualCompletionTime} placeholder="Auto" onChange={(e) => setActualCompletionTime(e.target.value)} onBlur={handleCompletionTimeBlur} disabled={isReadOnly} className={`${inputClasses} w-16 text-center border-purple-200 dark:border-purple-800/50 focus:ring-purple-500/50`} />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">/ {line.completionSlaTarget !== null ? `${line.completionSlaTarget}h` : "—"}</span>
        </div>
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-900/10 text-center">
        <PerformanceBadge actual={line.actualCompletionTime} target={line.completionSlaTarget} />
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-purple-50/30 dark:bg-purple-900/10">
        <input type="text" value={resolutionStatus} onChange={(e) => setResolutionStatus(e.target.value)} onBlur={handleResolutionStatusBlur} disabled={isReadOnly} placeholder="Status..." className={`${inputClasses} border-purple-200 dark:border-purple-800/50 focus:ring-purple-500/50`} />
      </td>

      {/* Actions */}
      {!isReadOnly && (
        <td className="py-3 px-3 align-middle text-center">
          <button onClick={() => handleDeleteSlaLine(line.id)} disabled={isPending} className="p-2 text-slate-400 hover:text-white hover:bg-rose-500 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Delete Line">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  );
}

function UpdateFrequencyRow({
  entry,
  targetFreq,
  isReadOnly,
  savingEntryId,
  handleAutoSaveEntry,
  handleDeleteEntry,
  isPending
}: {
  entry: UpdateFrequencyEntryData;
  targetFreq: number | null;
  isReadOnly?: boolean;
  savingEntryId: string | null;
  handleAutoSaveEntry: (id: string, data: Partial<UpdateFrequencyEntryData>) => Promise<void>;
  handleDeleteEntry: (id: string) => Promise<void>;
  isPending: boolean;
}) {
  const isSavingThis = savingEntryId === entry.id;
  const [actualFreq, setActualFreq] = useState(entry.actualUpdateFrequency !== null ? String(entry.actualUpdateFrequency) : "");
  const [note, setNote] = useState(entry.note || "");

  useEffect(() => setActualFreq(entry.actualUpdateFrequency !== null ? String(entry.actualUpdateFrequency) : ""), [entry.actualUpdateFrequency]);
  useEffect(() => setNote(entry.note || ""), [entry.note]);

  const handleActualFreqBlur = () => { const val = actualFreq ? parseFloat(actualFreq) : null; if (val !== entry.actualUpdateFrequency) handleAutoSaveEntry(entry.id, { actualUpdateFrequency: val }); };
  const handleNoteBlur = () => { if (note.trim() !== (entry.note || "")) handleAutoSaveEntry(entry.id, { note: note.trim() }); };

  const inputClasses = "bg-transparent border-none outline-none focus:ring-2 focus:ring-teal-500/20 rounded p-1 text-[11px] font-semibold text-slate-600 dark:text-slate-400 w-full";

  return (
    <tr className={`group hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors border-b border-slate-200 dark:border-slate-800 ${isSavingThis ? "opacity-70 bg-amber-50 dark:bg-amber-900/10" : ""}`}>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-teal-50/30 dark:bg-teal-900/10">
        <input type="datetime-local" value={formatDTLocal(entry.customerResponseDateTime)} onChange={(e) => handleAutoSaveEntry(entry.id, { customerResponseDateTime: e.target.value })} disabled={isReadOnly} className={`${inputClasses} cursor-pointer text-center border-teal-200 dark:border-teal-800/50`} />
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-teal-50/30 dark:bg-teal-900/10">
        <input type="datetime-local" value={formatDTLocal(entry.updateDateTime)} onChange={(e) => handleAutoSaveEntry(entry.id, { updateDateTime: e.target.value })} disabled={isReadOnly} className={`${inputClasses} cursor-pointer text-center border-teal-200 dark:border-teal-800/50`} />
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-teal-50/30 dark:bg-teal-900/10 text-center">
        <div className="flex items-center justify-center gap-2 w-full min-w-[120px]">
          <input type="number" step="0.01" value={actualFreq} placeholder="Auto" onChange={(e) => setActualFreq(e.target.value)} onBlur={handleActualFreqBlur} disabled={isReadOnly} className={`${inputClasses} w-16 text-center border-teal-200 dark:border-teal-800/50`} />
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">/ {targetFreq !== null ? `${targetFreq}h` : "—"}</span>
        </div>
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-teal-50/30 dark:bg-teal-900/10 text-center">
        <PerformanceBadge actual={entry.actualUpdateFrequency} target={targetFreq} />
      </td>
      <td className="py-3 px-3 align-middle border-r border-slate-200 dark:border-slate-800 bg-teal-50/30 dark:bg-teal-900/10">
        <div className="relative flex items-center w-full">
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} onBlur={handleNoteBlur} disabled={isReadOnly} placeholder="Remark note..." className={`${inputClasses} pr-16 border-teal-200 dark:border-teal-800/50`} />
          {isSavingThis && <div className="absolute right-2 flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-bold bg-amber-100 dark:bg-amber-900/80 px-2 py-0.5 rounded-full animate-pulse"><RefreshCw className="w-3 h-3 animate-spin text-amber-500" /></div>}
        </div>
      </td>
      {!isReadOnly && (
        <td className="py-3 px-3 align-middle text-center">
          <button onClick={() => handleDeleteEntry(entry.id)} disabled={isPending} className="p-2 text-slate-400 hover:text-white hover:bg-rose-500 rounded-md transition-all opacity-0 group-hover:opacity-100 focus:opacity-100" title="Delete Entry">
            <Trash2 className="w-4 h-4" />
          </button>
        </td>
      )}
    </tr>
  );
}

export function SlaTab({ requestId, slaLines = [], isReadOnly = false, requestData }: SlaTabProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [savingLineId, setSavingLineId] = useState<string | null>(null);
  const [savingEntryId, setSavingEntryId] = useState<string | null>(null);
  const [editingLine, setEditingLine] = useState<SlaLineData | null>(null);

  const [newLine, setNewLine] = useState({
    title: "",
    priority: "P4",
    ticketType: "SRO",
    ticketRequestDateTime: formatDTLocal(new Date())
  });

  const [newUpdateEntry, setNewUpdateEntry] = useState({
    customerResponseDateTime: "",
    updateDateTime: formatDTLocal(new Date()),
    note: ""
  });
  
  const isIncidentOrProblem = requestData?.type === "INCIDENT" || requestData?.type === "PROBLEM";
  const targetFreq = requestData?.updateFreqTarget ?? null;
  const updateEntries = requestData?.slaUpdateEntries || [];

  const activeDetailInDb = editingLine ? slaLines.find(l => l.id === editingLine.id) : null;

  const handleAutoSaveLine = async (lineId: string, updatedFields: Partial<SlaLineData>) => {
    setSavingLineId(lineId);
    const payload: any = { ...updatedFields };
    if (updatedFields.ticketRequestDateTime !== undefined) payload.ticketRequestDateTime = updatedFields.ticketRequestDateTime || null;
    if (updatedFields.ackDateTime !== undefined) payload.ackDateTime = updatedFields.ackDateTime || null;
    if (updatedFields.responseDateTime !== undefined) payload.responseDateTime = updatedFields.responseDateTime || null;
    if (updatedFields.completionDateTime !== undefined) payload.completionDateTime = updatedFields.completionDateTime || null;

    const result = await updateSlaLine(lineId, requestId, payload);
    if (result.error) toast.error(result.error);
    else router.refresh();
    setSavingLineId(null);
  };

  const handleAddSlaLine = async () => {
    const title = newLine.title.trim() || `SLA Line ${slaLines.length + 1}`;
    startTransition(async () => {
      const result = await addSlaLine(requestId, {
        title,
        priority: newLine.priority,
        ticketType: newLine.ticketType,
        ticketRequestDateTime: requestData?.raiseDate || null
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Primary SLA Line added");
        setNewLine({
          title: "",
          priority: "P4",
          ticketType: "SRO",
          ticketRequestDateTime: formatDTLocal(new Date())
        });
        router.refresh();
      }
    });
  };

  const handleDeleteSlaLine = async (lineId: string) => {
    if (!confirm("Are you sure you want to delete this SLA Line?")) return;
    startTransition(async () => {
      const result = await deleteSlaLine(lineId, requestId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("SLA Line deleted");
        if (editingLine?.id === lineId) setEditingLine(null);
        router.refresh();
      }
    });
  };

  // Update Frequency Actions
  const handleAutoSaveEntry = async (entryId: string, updatedFields: Partial<UpdateFrequencyEntryData>) => {
    setSavingEntryId(entryId);
    const payload: any = { ...updatedFields };
    if (updatedFields.customerResponseDateTime !== undefined) payload.customerResponseDateTime = updatedFields.customerResponseDateTime || null;
    if (updatedFields.updateDateTime !== undefined) payload.updateDateTime = updatedFields.updateDateTime || null;

    const result = await updateSlaUpdateEntry(entryId, requestId, payload);
    if (result.error) toast.error(result.error);
    else router.refresh();
    setSavingEntryId(null);
  };

  const handleAddUpdateEntry = async () => {
    if (!newUpdateEntry.updateDateTime) {
      toast.error("Update Date Time is required");
      return;
    }
    startTransition(async () => {
      const result = await addSlaUpdateEntry(requestId, {
        customerResponseDateTime: newUpdateEntry.customerResponseDateTime || null,
        updateDateTime: newUpdateEntry.updateDateTime,
        note: newUpdateEntry.note.trim() || undefined
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Update Frequency Entry added");
        setNewUpdateEntry({
          customerResponseDateTime: "",
          updateDateTime: formatDTLocal(new Date()),
          note: ""
        });
        router.refresh();
      }
    });
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!confirm("Are you sure you want to delete this Update Frequency entry?")) return;
    startTransition(async () => {
      const result = await deleteSlaUpdateEntry(entryId, requestId);
      if (result.error) toast.error(result.error);
      else {
        toast.success("Entry deleted");
        router.refresh();
      }
    });
  };

  return (
    <div className="space-y-8 pb-10 max-w-full">
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        
        {/* Header Section */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-widest flex items-center gap-2">
            <div className="w-1.5 h-5 bg-indigo-500 rounded-full animate-pulse" />
            Unified SLA Tracker
          </h3>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <span className="hidden sm:flex text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              Auto-saving
            </span>
            <span className="text-[10px] font-black bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-3 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/50">
              {slaLines.length} Primary | {updateEntries.length} Updates
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-8">
          
          {/* PRIMARY SLA TRACKER SECTION */}
          <div className="space-y-4">
            <div className="hidden xl:block overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 pb-2">
              <div className="p-3 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-700 dark:text-slate-300">Primary SLA Tracker</h3>
              </div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-center">
                    <th className="py-3 px-3 w-[50px] border-r border-slate-200 dark:border-slate-700">Form</th>
                    <th colSpan={3} className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-left">SLA General Info</th>
                    <th colSpan={4} className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300">Acknowledgement</th>
                    <th colSpan={3} className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 bg-sky-100 dark:bg-sky-900/30 text-sky-800 dark:text-sky-300">First Response</th>
                    <th colSpan={4} className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">Completion Target</th>
                    {!isReadOnly && <th className="py-3 px-3 w-[60px]">Del</th>}
                  </tr>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                    <th className="py-3 border-r border-slate-200 dark:border-slate-700"></th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 text-left min-w-[200px]">Item Title</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[120px]">Type</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[80px]">Priority</th>
                    
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[170px]">Ticket Req DT</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[170px] bg-amber-50/50 dark:bg-amber-900/10">Ack DT</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[170px] bg-amber-50/50 dark:bg-amber-900/10">Ack Actual/Target</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[120px] bg-amber-50/50 dark:bg-amber-900/10">Performance</th>
                    
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[170px] bg-sky-50/50 dark:bg-sky-900/10">Response DT</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[170px] bg-sky-50/50 dark:bg-sky-900/10">Resp Actual/Target</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[120px] bg-sky-50/50 dark:bg-sky-900/10">Performance</th>
                    
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[170px] bg-purple-50/50 dark:bg-purple-900/10">Completion DT</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[170px] bg-purple-50/50 dark:bg-purple-900/10">Comp Actual/Target</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[120px] bg-purple-50/50 dark:bg-purple-900/10">Performance</th>
                    <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[170px] bg-purple-50/50 dark:bg-purple-900/10">Resolution Status</th>
                    
                    {!isReadOnly && <th className="py-3"></th>}
                  </tr>
                </thead>
                <tbody>
                  {slaLines.length === 0 ? (
                    <tr>
                      <td colSpan={16} className="py-12 text-center text-slate-500 italic">No Primary SLA rows added yet.</td>
                    </tr>
                  ) : (
                    slaLines.map((line) => (
                      <SlaLineRow key={line.id} line={line} isReadOnly={isReadOnly} savingLineId={savingLineId} handleAutoSaveLine={handleAutoSaveLine} handleDeleteSlaLine={handleDeleteSlaLine} isPending={isPending} onOpenEditModal={(l) => setEditingLine(l)} />
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ADD NEW PRIMARY SLA FORM */}
            {!isReadOnly && (
              <div className="p-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Plus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-widest text-indigo-700 dark:text-indigo-400">Add Primary SLA</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                  <div className="sm:col-span-2 lg:col-span-4 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Item Description / Title</label>
                    <input type="text" placeholder="e.g. Incident DB down..." value={newLine.title} onChange={(e) => setNewLine({ ...newLine, title: e.target.value })} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs font-bold" />
                  </div>
                  <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Type</label>
                    <select value={newLine.ticketType} onChange={(e) => setNewLine({ ...newLine, ticketType: e.target.value })} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs font-bold">
                      <option value="INCIDENT">Incident</option>
                      <option value="PROBLEM">Problem</option>
                      <option value="SRO">SR</option>
                      <option value="NSRO">NSR</option>
                      <option value="OTHERS">Others</option>
                      <option value="HEALTH_CHECK">Health Check</option>
                    </select>
                  </div>
                  <div className="lg:col-span-2 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Priority</label>
                    <select value={newLine.priority} onChange={(e) => setNewLine({ ...newLine, priority: e.target.value })} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs font-bold">
                      <option value="P1">P1</option>
                      <option value="P2">P2</option>
                      <option value="P3">P3</option>
                      <option value="P4">P4</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Ticket Request DT</label>
                    <input type="datetime-local" value={formatDTLocal(requestData?.raiseDate)} disabled className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 p-2 rounded-xl text-xs font-bold opacity-60" />
                  </div>
                  <div className="sm:col-span-2 lg:col-span-1">
                    <button onClick={handleAddSlaLine} disabled={isPending} className="w-full py-2 bg-indigo-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center justify-center gap-1.5 h-[34px]">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* UPDATE FREQUENCY TRACKER SECTION */}
          {isIncidentOrProblem && (
            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
              <div className="hidden xl:block overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600 pb-2">
                <div className="p-3 bg-teal-50 dark:bg-teal-900/20 border-b border-teal-200 dark:border-teal-800/50 flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">Update Frequency Tracker</h3>
                  <span className="text-[10px] font-bold text-teal-600 dark:text-teal-500 bg-teal-100 dark:bg-teal-900/50 px-2 py-1 rounded-md">Incident / Problem Only</span>
                </div>
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest text-center">
                      <th colSpan={5} className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300">Update Frequency</th>
                      {!isReadOnly && <th className="py-3 px-3 w-[60px]">Del</th>}
                    </tr>
                    <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-center">
                      <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[200px] bg-teal-50/50 dark:bg-teal-900/10">Cust Reply DT</th>
                      <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[200px] bg-teal-50/50 dark:bg-teal-900/10">Team Update DT</th>
                      <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[200px] bg-teal-50/50 dark:bg-teal-900/10">Freq Actual/Target</th>
                      <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[120px] bg-teal-50/50 dark:bg-teal-900/10">Performance</th>
                      <th className="py-3 px-3 border-r border-slate-200 dark:border-slate-700 min-w-[300px] bg-teal-50/50 dark:bg-teal-900/10">Update Note</th>
                      {!isReadOnly && <th className="py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {updateEntries.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-500 italic">No Update Frequency entries logged yet.</td>
                      </tr>
                    ) : (
                      updateEntries.map((entry: any) => (
                        <UpdateFrequencyRow key={entry.id} entry={entry} targetFreq={targetFreq} isReadOnly={isReadOnly} savingEntryId={savingEntryId} handleAutoSaveEntry={handleAutoSaveEntry} handleDeleteEntry={handleDeleteEntry} isPending={isPending} />
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ADD NEW UPDATE FREQUENCY FORM */}
              {!isReadOnly && (
                <div className="p-4 bg-teal-50/50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800/50 rounded-2xl space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Plus className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                    <span className="text-xs font-black uppercase tracking-widest text-teal-700 dark:text-teal-400">Add Update Entry</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Cust Reply DT</label>
                      <input type="datetime-local" value={newUpdateEntry.customerResponseDateTime} onChange={(e) => setNewUpdateEntry({ ...newUpdateEntry, customerResponseDateTime: e.target.value })} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-teal-700 p-2 rounded-xl text-xs font-bold" />
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Team Update DT</label>
                      <input type="datetime-local" value={newUpdateEntry.updateDateTime} onChange={(e) => setNewUpdateEntry({ ...newUpdateEntry, updateDateTime: e.target.value })} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-teal-700 p-2 rounded-xl text-xs font-bold" />
                    </div>
                    <div className="flex-[2] space-y-1.5 w-full">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Note / Remark</label>
                      <input type="text" placeholder="What was communicated..." value={newUpdateEntry.note} onChange={(e) => setNewUpdateEntry({ ...newUpdateEntry, note: e.target.value })} className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-teal-700 p-2 rounded-xl text-xs font-bold" />
                    </div>
                    <button onClick={handleAddUpdateEntry} disabled={isPending || !newUpdateEntry.updateDateTime} className="w-full sm:w-auto px-6 py-2 bg-teal-600 text-white rounded-xl text-[11px] font-black uppercase tracking-widest hover:bg-teal-700 flex items-center justify-center gap-1.5 h-[34px]">
                      <Plus className="w-4 h-4" /> Log Update
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* VERTICAL FORM EDITOR POPUP DIALOG */}
      {activeDetailInDb && (
        <Modal
          isOpen={true}
          onClose={() => setEditingLine(null)}
          title={`Edit SLA Line: ${activeDetailInDb.title}`}
          maxWidth="max-w-3xl"
        >
          <SlaLineForm
            line={activeDetailInDb}
            handleAutoSaveLine={handleAutoSaveLine}
            isReadOnly={isReadOnly}
            requestData={requestData}
          />
        </Modal>
      )}
    </div>
  );
}
