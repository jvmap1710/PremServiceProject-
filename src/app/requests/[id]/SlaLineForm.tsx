"use client";

import { useState, useEffect } from "react";
import { SlaLineData } from "./SlaTab";

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

interface SlaLineFormProps {
  line: SlaLineData;
  handleAutoSaveLine: (lineId: string, updatedFields: Partial<SlaLineData>) => Promise<void>;
  isReadOnly: boolean;
  requestData?: any;
}

export function SlaLineForm({ line, handleAutoSaveLine, isReadOnly, requestData }: SlaLineFormProps) {
  const [title, setTitle] = useState(line.title);
  const [actualAckTime, setActualAckTime] = useState(line.actualAckTime !== null ? String(line.actualAckTime) : "");
  const [actualResponseTime, setActualResponseTime] = useState(line.actualResponseTime !== null ? String(line.actualResponseTime) : "");
  const [actualCompletionTime, setActualCompletionTime] = useState(line.actualCompletionTime !== null ? String(line.actualCompletionTime) : "");
  const [resolutionStatus, setResolutionStatus] = useState(line.resolutionStatus || "");

  // Sync state
  useEffect(() => { setTitle(line.title); }, [line.title]);
  useEffect(() => { setActualAckTime(line.actualAckTime !== null ? String(line.actualAckTime) : ""); }, [line.actualAckTime]);
  useEffect(() => { setActualResponseTime(line.actualResponseTime !== null ? String(line.actualResponseTime) : ""); }, [line.actualResponseTime]);
  useEffect(() => { setActualCompletionTime(line.actualCompletionTime !== null ? String(line.actualCompletionTime) : ""); }, [line.actualCompletionTime]);
  useEffect(() => { setResolutionStatus(line.resolutionStatus || ""); }, [line.resolutionStatus]);

  const handleTitleBlur = () => { if (title.trim() !== line.title) handleAutoSaveLine(line.id, { title: title.trim() }); };
  const handleAckTimeBlur = () => { const val = actualAckTime ? parseFloat(actualAckTime) : null; if (val !== line.actualAckTime) handleAutoSaveLine(line.id, { actualAckTime: val }); };
  const handleResponseTimeBlur = () => { const val = actualResponseTime ? parseFloat(actualResponseTime) : null; if (val !== line.actualResponseTime) handleAutoSaveLine(line.id, { actualResponseTime: val }); };
  const handleCompletionTimeBlur = () => { const val = actualCompletionTime ? parseFloat(actualCompletionTime) : null; if (val !== line.actualCompletionTime) handleAutoSaveLine(line.id, { actualCompletionTime: val }); };
  const handleResolutionStatusBlur = () => { if (resolutionStatus.trim() !== (line.resolutionStatus || "")) handleAutoSaveLine(line.id, { resolutionStatus: resolutionStatus.trim() }); };

  return (
    <div className="space-y-6">
      <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-inner">
        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-600"></span>
          General Properties
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">SLA Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleBlur}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Type</label>
            <select
              value={line.ticketType}
              onChange={(e) => handleAutoSaveLine(line.id, { ticketType: e.target.value })}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="INCIDENT">Incident</option>
              <option value="PROBLEM">Problem</option>
              <option value="SRO">SR</option>
              <option value="NSRO">NSR</option>
              <option value="OTHERS">Others</option>
              <option value="HEALTH_CHECK">Health Check</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Priority</label>
            <select
              value={line.priority}
              onChange={(e) => handleAutoSaveLine(line.id, { priority: e.target.value })}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-slate-800 p-2.5 rounded-xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
              <option value="P4">P4</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-amber-950/20 p-5 rounded-2xl border border-amber-900/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-amber-500 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          Acknowledgement SLA
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-amber-200 uppercase tracking-widest block">Ticket Request DT</label>
            <input
              type="datetime-local"
              value={formatDTLocal(line.ticketRequestDateTime)}
              disabled
              className="w-full bg-amber-950/50 border border-amber-900/40 p-2.5 rounded-xl text-xs font-bold text-amber-100/50 outline-none cursor-not-allowed"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-amber-200 uppercase tracking-widest block">Ack DT</label>
            <input
              type="datetime-local"
              value={formatDTLocal(line.ackDateTime)}
              onChange={(e) => handleAutoSaveLine(line.id, { ackDateTime: e.target.value })}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-amber-900/40 p-2.5 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-amber-200 uppercase tracking-widest block">Actual Ack Time (h)</label>
            <input
              type="number" step="0.01"
              value={actualAckTime}
              placeholder="Auto calculated"
              onChange={(e) => setActualAckTime(e.target.value)}
              onBlur={handleAckTimeBlur}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-amber-900/40 p-2.5 rounded-xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
        </div>
      </div>

      <div className="bg-sky-950/20 p-5 rounded-2xl border border-sky-900/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-sky-500 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-500"></span>
          First Response SLA
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-sky-200 uppercase tracking-widest block">Response DT</label>
            <input
              type="datetime-local"
              value={formatDTLocal(line.responseDateTime)}
              onChange={(e) => handleAutoSaveLine(line.id, { responseDateTime: e.target.value })}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-sky-900/40 p-2.5 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-sky-200 uppercase tracking-widest block">Actual Response Time (h)</label>
            <input
              type="number" step="0.01"
              value={actualResponseTime}
              placeholder="Auto calculated"
              onChange={(e) => setActualResponseTime(e.target.value)}
              onBlur={handleResponseTimeBlur}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-sky-900/40 p-2.5 rounded-xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-sky-500/20"
            />
          </div>
        </div>
      </div>
      
      <div className="bg-purple-950/20 p-5 rounded-2xl border border-purple-900/30">
        <h4 className="text-xs font-black uppercase tracking-widest text-purple-500 mb-4 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          Completion SLA
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-purple-200 uppercase tracking-widest block">Completion DT</label>
            <input
              type="datetime-local"
              value={formatDTLocal(line.completionDateTime)}
              onChange={(e) => handleAutoSaveLine(line.id, { completionDateTime: e.target.value })}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-purple-900/40 p-2.5 rounded-xl text-xs font-bold text-white outline-none cursor-pointer focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-purple-200 uppercase tracking-widest block">Actual Completion Time (h)</label>
            <input
              type="number" step="0.01"
              value={actualCompletionTime}
              placeholder="Auto calculated"
              onChange={(e) => setActualCompletionTime(e.target.value)}
              onBlur={handleCompletionTimeBlur}
              disabled={isReadOnly}
              className="w-full bg-slate-900 border border-purple-900/40 p-2.5 rounded-xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
          <div className="space-y-1.5 md:col-span-2">
            <label className="text-[10px] font-bold text-purple-200 uppercase tracking-widest block">Resolution Status</label>
            <input
              type="text"
              value={resolutionStatus}
              onChange={(e) => setResolutionStatus(e.target.value)}
              onBlur={handleResolutionStatusBlur}
              disabled={isReadOnly}
              placeholder="Fixed, Resolved, Closed..."
              className="w-full bg-slate-900 border border-purple-900/40 p-2.5 rounded-xl text-xs font-black text-white outline-none focus:ring-2 focus:ring-purple-500/20"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
