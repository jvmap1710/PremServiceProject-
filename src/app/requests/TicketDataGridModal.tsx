"use client";

import { Modal } from "@/components/ui/Modal";
import { useState, useEffect } from "react";
import { getAllRequestsForExport } from "@/actions/request";
import { updateGridTicket, updateGridSlaLine, updateGridSlaUpdateEntry } from "@/actions/grid";
import { Loader2, Download, Save, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export function TicketDataGridModal({
  isOpen,
  onClose,
  filters
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: any;
}) {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    const res = await getAllRequestsForExport(filters);
    if (res.success && res.requests) {
      const flattened: any[] = [];
      let globalItemNumber = 1;

      res.requests.forEach((req: any) => {
        const hasLines = req.slaLines && req.slaLines.length > 0;
        const hasUpdates = req.slaUpdateEntries && req.slaUpdateEntries.length > 0;
        
        const rowsToGenerate = hasUpdates ? req.slaUpdateEntries : (hasLines ? req.slaLines : [{}]);
        
        rowsToGenerate.forEach((entry: any, index: number) => {
          const line = hasLines ? (req.slaLines[index] || req.slaLines[0]) : null;
          const update = hasUpdates ? (req.slaUpdateEntries[index] || req.slaUpdateEntries[0]) : null;
          
          flattened.push({
            _rowId: `${req.id}-${line?.id || 'noline'}-${update?.id || 'noupdate'}`,
            ticket: req,
            line: line,
            update: update,
            isFirstLine: index === 0,
            rowSpan: rowsToGenerate.length,
            itemNumber: globalItemNumber
          });
        });
        globalItemNumber++;
      });
      setData(flattened);
    } else {
      toast.error(res.error || "Failed to load grid data");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, filters]);

  const handleTicketChange = async (ticketId: string, field: string, value: string) => {
    setSavingId(`t-${ticketId}`);
    const res = await updateGridTicket(ticketId, { [field]: value });
    if (res.error) toast.error(res.error);
    else loadData(); // Reload to refresh everything smoothly
    setSavingId(null);
  };

  const handleLineChange = async (lineId: string, field: string, value: string | null) => {
    if (!lineId) return;
    setSavingId(`l-${lineId}`);
    let finalValue: any = value;
    if (value === "") finalValue = null;
    else if (field.includes("DateTime") && value) {
      finalValue = new Date(value).toISOString();
    }
    
    const res = await updateGridSlaLine(lineId, { [field]: finalValue });
    if (res.error) toast.error(res.error);
    else loadData();
    setSavingId(null);
  };

  const handleUpdateChange = async (updateId: string, field: string, value: string | null) => {
    if (!updateId) return;
    setSavingId(`u-${updateId}`);
    let finalValue: any = value;
    if (value === "") finalValue = null;
    else if (field.includes("DateTime") && value) {
      finalValue = new Date(value).toISOString();
    }
    
    const res = await updateGridSlaUpdateEntry(updateId, { [field]: finalValue });
    if (res.error) toast.error(res.error);
    else loadData();
    setSavingId(null);
  };

  const handleExport = async () => {
    try {
      const toastId = toast.loading("Generating Excel file...");
      const ExcelJS = (await import("exceljs")).default || await import("exceljs");
      const { saveAs } = await import("file-saver");
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("SLA Compliance");
      
      const headers = [
        "Ticket ID", "Customer Code", "Ticket No.", "Ticket Code", "Ticket Detail", "Ticket Title",
        "Ticket Request Datetime", "Month", "Year", "Ticket Item No.", "Ticket Item ID",
        "Request Classification", "Priority Level", "Concat SR Classification", "Request Type",
        "Concat Customer Code + Request Type", "Average estimated time required per request (hour)",
        "No. Requests in scope per month", "Escalation Type", "Acknowledgement SLA Target",
        "Actual Acknowledgement Datetime", "Actual Acknowledgement Time (hours)",
        "Actual Acknowledgement Performance", "Response SLA Target", "Actual Response Time",
        "Actual Response Time (hours)", "Response Time Performance", "Update Frequency SLA Target",
        "Customer Response Time (to compare with Actual Update Frequency SLA)",
        "Actual Update Frequency Time", "Actual Update Frequency (hours)", "Update Frequency NOTE",
        "Update Frequency Performance", "Actual TAS Man-hours", "Estimated Man Hours",
        "Agreed Final Solution Datetime", "Estimated Timeline", "PIC SE", "Actual SE Start Datetime",
        "Actual SE Man-hours", "Actual M-Files Man-hours", "Actual President Solution Man-hours",
        "Service Restoration/ Request Completion SLA Target",
        "Actual Service Restoration/ Request Completion Datetime",
        "Actual Service Restoration/ Request Completion (hours)",
        "Service Restoration/ Request Completion Performance", "Actual Total Man-hours", "Status"
      ];
      worksheet.addRow(headers);
      worksheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
      worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FF4F46E5" } };
      
      const formatDT = (dt: any) => dt ? new Date(dt).toLocaleString("en-GB") : "";
      
      data.forEach(row => {
        const { ticket: req, line, update, itemNumber, isFirstLine } = row;
        const reqDT = req.raiseDate ? new Date(req.raiseDate) : null;
        const month = reqDT ? reqDT.getMonth() + 1 : "";
        const year = reqDT ? reqDT.getFullYear() : "";

        let totalWorkHours = 0;
        let tasWorkHours = 0;
        if (req.workLogs) {
          req.workLogs.forEach((log: any) => {
            totalWorkHours += (log.hours || 0);
            if (log.userId === req.assigneeId) tasWorkHours += (log.hours || 0);
          });
        }
        let totalEstHours = 0;
        if (req.items) {
           req.items.forEach((item: any) => {
              totalEstHours += (item.quantity * (item.sroRule?.estimateHours || 0));
           });
        }

        const l = line || {};
        const u = update || {};

        const rowData = [
          req.id, req.client?.code || "", itemNumber, req.code || "", req.description || "", req.title || "",
          formatDT(req.raiseDate), month, year, itemNumber - 1, l.id || "", req.type || "", l.priority || "",
          `${req.client?.code || ""}_${req.type || ""}`, l.ticketType || "",
          `${req.client?.code || ""}_${l.ticketType || ""}`, totalEstHours || "", req.package?.monthlyQuota || "", req.escalation || "",
          l.ackSlaTarget !== null && l.ackSlaTarget !== undefined ? l.ackSlaTarget : "", formatDT(l.ackDateTime),
          l.actualAckTime !== null && l.actualAckTime !== undefined ? l.actualAckTime : "",
          l.actualAckTime !== null && l.actualAckTime !== undefined && l.ackSlaTarget !== null && l.ackSlaTarget !== undefined ? (l.actualAckTime <= l.ackSlaTarget ? "Met" : "Exceeded") : "",
          l.responseSlaTarget !== null && l.responseSlaTarget !== undefined ? l.responseSlaTarget : "",
          l.actualResponseTime !== null && l.actualResponseTime !== undefined ? l.actualResponseTime : "",
          l.actualResponseTime !== null && l.actualResponseTime !== undefined ? l.actualResponseTime : "",
          l.actualResponseTime !== null && l.actualResponseTime !== undefined && l.responseSlaTarget !== null && l.responseSlaTarget !== undefined ? (l.actualResponseTime <= l.responseSlaTarget ? "Met" : "Exceeded") : "",
          l.updateFreqSlaTarget !== null && l.updateFreqSlaTarget !== undefined ? l.updateFreqSlaTarget : "",
          formatDT(u.customerResponseDateTime),
          u.actualUpdateFrequency !== null && u.actualUpdateFrequency !== undefined ? u.actualUpdateFrequency : "",
          u.actualUpdateFrequency !== null && u.actualUpdateFrequency !== undefined ? u.actualUpdateFrequency : "",
          u.note || "",
          u.actualUpdateFrequency !== null && u.actualUpdateFrequency !== undefined && l.updateFreqSlaTarget !== null && l.updateFreqSlaTarget !== undefined ? (u.actualUpdateFrequency <= l.updateFreqSlaTarget ? "Met" : "Exceeded") : "",
          tasWorkHours || "", totalEstHours || "",
          "", "", req.assignee?.name || "", "", "", "", "",
          l.completionSlaTarget !== null && l.completionSlaTarget !== undefined ? l.completionSlaTarget : "",
          formatDT(l.completionDateTime),
          l.actualCompletionTime !== null && l.actualCompletionTime !== undefined ? l.actualCompletionTime : "",
          l.actualCompletionTime !== null && l.actualCompletionTime !== undefined && l.completionSlaTarget !== null && l.completionSlaTarget !== undefined ? (l.actualCompletionTime <= l.completionSlaTarget ? "Met" : "Exceeded") : "",
          totalWorkHours || "", req.status || ""
        ];
        worksheet.addRow(rowData);
      });
      
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Master_SLA_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
      toast.success("Export successful", { id: toastId });
    } catch (e) {
      toast.error("Export failed");
    }
  };

  const inputClasses = "w-full bg-transparent border border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 rounded px-1 py-1 text-[10px] outline-none transition-all";

  const formatDateForInput = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="DATA GRID PREVIEW (EDITABLE 48 COLUMNS)" maxWidth="max-w-[98vw]">
      <div className="flex flex-col h-[85vh]">
        <div className="flex items-center justify-between mb-4 shrink-0">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Edit SLA targets and actual times directly in the grid before exporting.
          </p>
          <div className="flex gap-2">
            <button onClick={loadData} disabled={loading} className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </button>
            <button onClick={handleExport} disabled={loading || data.length === 0} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-black uppercase tracking-wider">
              <Download className="w-3.5 h-3.5" /> Export Cooked Excel
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 rounded-xl border border-slate-200 shadow-inner custom-scrollbar">
          {loading && data.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <table className="w-max text-left text-[10px] whitespace-nowrap border-collapse">
              <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-900 shadow-sm font-black uppercase tracking-widest text-slate-600">
                <tr>
                  <th className="p-2 border border-slate-300">Ticket ID</th>
                  <th className="p-2 border border-slate-300">Cust Code</th>
                  <th className="p-2 border border-slate-300">Ticket No.</th>
                  <th className="p-2 border border-slate-300">Ticket Code</th>
                  <th className="p-2 border border-slate-300 min-w-[200px]">Detail</th>
                  <th className="p-2 border border-slate-300 min-w-[200px]">Title</th>
                  <th className="p-2 border border-slate-300">Request DT</th>
                  <th className="p-2 border border-slate-300">Month</th>
                  <th className="p-2 border border-slate-300">Year</th>
                  <th className="p-2 border border-slate-300">Item No.</th>
                  <th className="p-2 border border-slate-300">Item ID</th>
                  <th className="p-2 border border-slate-300">Req Classification</th>
                  <th className="p-2 border border-slate-300 text-blue-600">Priority ✏️</th>
                  <th className="p-2 border border-slate-300">Concat SR Class</th>
                  <th className="p-2 border border-slate-300">Request Type</th>
                  <th className="p-2 border border-slate-300">Concat Cust+Type</th>
                  <th className="p-2 border border-slate-300">Avg Est Time (hr)</th>
                  <th className="p-2 border border-slate-300">Quota/mo</th>
                  <th className="p-2 border border-slate-300">Escalation</th>
                  <th className="p-2 border border-slate-300 bg-amber-50">Ack Target (h)</th>
                  <th className="p-2 border border-slate-300 bg-amber-50 text-blue-600">Ack Actual DT ✏️</th>
                  <th className="p-2 border border-slate-300 bg-amber-50">Ack Actual (h)</th>
                  <th className="p-2 border border-slate-300 bg-amber-50">Ack Perf</th>
                  <th className="p-2 border border-slate-300 bg-indigo-50">Resp Target (h)</th>
                  <th className="p-2 border border-slate-300 bg-indigo-50">Resp Actual</th>
                  <th className="p-2 border border-slate-300 bg-indigo-50 text-blue-600">Resp Actual DT ✏️</th>
                  <th className="p-2 border border-slate-300 bg-indigo-50">Resp Perf</th>
                  <th className="p-2 border border-slate-300 bg-teal-50">Update Target (h)</th>
                  <th className="p-2 border border-slate-300 bg-teal-50 text-blue-600">Cust Reply DT ✏️</th>
                  <th className="p-2 border border-slate-300 bg-teal-50 text-blue-600">Team Update DT ✏️</th>
                  <th className="p-2 border border-slate-300 bg-teal-50">Update Actual (h)</th>
                  <th className="p-2 border border-slate-300 bg-teal-50 text-blue-600 min-w-[200px]">Update Note ✏️</th>
                  <th className="p-2 border border-slate-300 bg-teal-50">Update Perf</th>
                  <th className="p-2 border border-slate-300">TAS Man-hrs</th>
                  <th className="p-2 border border-slate-300">Est Man-hrs</th>
                  <th className="p-2 border border-slate-300">Agreed Final Sol DT</th>
                  <th className="p-2 border border-slate-300">Est Timeline</th>
                  <th className="p-2 border border-slate-300">PIC SE</th>
                  <th className="p-2 border border-slate-300">SE Start DT</th>
                  <th className="p-2 border border-slate-300">SE Man-hrs</th>
                  <th className="p-2 border border-slate-300">M-Files Man-hrs</th>
                  <th className="p-2 border border-slate-300">Pres Sol Man-hrs</th>
                  <th className="p-2 border border-slate-300 bg-green-50">Comp Target (h)</th>
                  <th className="p-2 border border-slate-300 bg-green-50 text-blue-600">Comp Actual DT ✏️</th>
                  <th className="p-2 border border-slate-300 bg-green-50">Comp Actual (h)</th>
                  <th className="p-2 border border-slate-300 bg-green-50">Comp Perf</th>
                  <th className="p-2 border border-slate-300">Total Man-hrs</th>
                  <th className="p-2 border border-slate-300 text-blue-600">Status ✏️</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                  const { ticket: t, line: l, update: u, itemNumber, isFirstLine, _rowId } = row;
                  const reqDT = t.raiseDate ? new Date(t.raiseDate) : null;

                  return (
                    <tr key={_rowId} className="border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-2 border border-slate-200">{t.id}</td>
                      <td className="p-2 border border-slate-200">{t.client?.code}</td>
                      <td className="p-2 border border-slate-200 text-center">{itemNumber}</td>
                      <td className="p-2 border border-slate-200">{t.code}</td>
                      <td className="p-2 border border-slate-200 max-w-[200px] truncate" title={t.description}>{t.description}</td>
                      <td className="p-2 border border-slate-200 max-w-[200px] truncate" title={t.title}>{t.title}</td>
                      <td className="p-2 border border-slate-200">{reqDT ? reqDT.toLocaleString("en-GB") : ""}</td>
                      <td className="p-2 border border-slate-200 text-center">{reqDT ? reqDT.getMonth() + 1 : ""}</td>
                      <td className="p-2 border border-slate-200 text-center">{reqDT ? reqDT.getFullYear() : ""}</td>
                      <td className="p-2 border border-slate-200 text-center">{itemNumber - 1}</td>
                      <td className="p-2 border border-slate-200">{l?.id}</td>
                      <td className="p-2 border border-slate-200">{t.type}</td>
                      
                      {/* Priority */}
                      <td className="p-1 border border-slate-200">
                        {isFirstLine && (
                          <select value={t.priority} onChange={(e) => handleTicketChange(t.id, 'priority', e.target.value)} className={inputClasses}>
                            <option value="P1">P1</option>
                            <option value="P2">P2</option>
                            <option value="P3">P3</option>
                            <option value="P4">P4</option>
                          </select>
                        )}
                      </td>
                      
                      <td className="p-2 border border-slate-200">{`${t.client?.code}_${t.type}`}</td>
                      <td className="p-2 border border-slate-200">{l?.ticketType}</td>
                      <td className="p-2 border border-slate-200">{`${t.client?.code}_${l?.ticketType}`}</td>
                      <td className="p-2 border border-slate-200 text-center">Auto</td>
                      <td className="p-2 border border-slate-200 text-center">{t.package?.monthlyQuota}</td>
                      <td className="p-2 border border-slate-200">{t.escalation}</td>
                      
                      {/* ACK */}
                      <td className="p-2 border border-slate-200 bg-amber-50/30 text-center">{l?.ackSlaTarget}</td>
                      <td className="p-1 border border-slate-200 bg-amber-50/30">
                        {l && isFirstLine && (
                          <input type="datetime-local" value={formatDateForInput(l.ackDateTime)} onChange={(e) => handleLineChange(l.id, 'ackDateTime', e.target.value)} className={inputClasses} />
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 bg-amber-50/30 text-center">{l?.actualAckTime}</td>
                      <td className="p-2 border border-slate-200 bg-amber-50/30 text-center">{l?.actualAckTime !== null && l?.ackSlaTarget !== null ? (l.actualAckTime <= l.ackSlaTarget ? "Met" : "Exceeded") : ""}</td>
                      
                      {/* RESP */}
                      <td className="p-2 border border-slate-200 bg-indigo-50/30 text-center">{l?.responseSlaTarget}</td>
                      <td className="p-2 border border-slate-200 bg-indigo-50/30 text-center">{l?.actualResponseTime}</td>
                      <td className="p-1 border border-slate-200 bg-indigo-50/30">
                        {l && isFirstLine && (
                          <input type="datetime-local" value={formatDateForInput(l.responseDateTime)} onChange={(e) => handleLineChange(l.id, 'responseDateTime', e.target.value)} className={inputClasses} />
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 bg-indigo-50/30 text-center">{l?.actualResponseTime !== null && l?.responseSlaTarget !== null ? (l.actualResponseTime <= l.responseSlaTarget ? "Met" : "Exceeded") : ""}</td>
                      
                      {/* UPDATE FREQ */}
                      <td className="p-2 border border-slate-200 bg-teal-50/30 text-center">{l?.updateFreqSlaTarget}</td>
                      <td className="p-1 border border-slate-200 bg-teal-50/30">
                        {u && (
                          <input type="datetime-local" value={formatDateForInput(u.customerResponseDateTime)} onChange={(e) => handleUpdateChange(u.id, 'customerResponseDateTime', e.target.value)} className={inputClasses} />
                        )}
                      </td>
                      <td className="p-1 border border-slate-200 bg-teal-50/30">
                        {u && (
                          <input type="datetime-local" value={formatDateForInput(u.updateDateTime)} onChange={(e) => handleUpdateChange(u.id, 'updateDateTime', e.target.value)} className={inputClasses} />
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 bg-teal-50/30 text-center">{u?.actualUpdateFrequency}</td>
                      <td className="p-1 border border-slate-200 bg-teal-50/30">
                        {u && (
                          <input type="text" value={u.note || ""} onChange={(e) => handleUpdateChange(u.id, 'note', e.target.value)} className={inputClasses} />
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 bg-teal-50/30 text-center">{u?.actualUpdateFrequency !== null && l?.updateFreqSlaTarget !== null ? (u.actualUpdateFrequency <= l.updateFreqSlaTarget ? "Met" : "Exceeded") : ""}</td>
                      
                      {/* HRS */}
                      <td className="p-2 border border-slate-200 text-center">Auto</td>
                      <td className="p-2 border border-slate-200 text-center">Auto</td>
                      <td className="p-2 border border-slate-200"></td>
                      <td className="p-2 border border-slate-200"></td>
                      <td className="p-2 border border-slate-200">{t.assignee?.name}</td>
                      <td className="p-2 border border-slate-200"></td>
                      <td className="p-2 border border-slate-200"></td>
                      <td className="p-2 border border-slate-200"></td>
                      <td className="p-2 border border-slate-200"></td>

                      {/* COMP */}
                      <td className="p-2 border border-slate-200 bg-green-50/30 text-center">{l?.completionSlaTarget}</td>
                      <td className="p-1 border border-slate-200 bg-green-50/30">
                        {l && isFirstLine && (
                          <input type="datetime-local" value={formatDateForInput(l.completionDateTime)} onChange={(e) => handleLineChange(l.id, 'completionDateTime', e.target.value)} className={inputClasses} />
                        )}
                      </td>
                      <td className="p-2 border border-slate-200 bg-green-50/30 text-center">{l?.actualCompletionTime}</td>
                      <td className="p-2 border border-slate-200 bg-green-50/30 text-center">{l?.actualCompletionTime !== null && l?.completionSlaTarget !== null ? (l.actualCompletionTime <= l.completionSlaTarget ? "Met" : "Exceeded") : ""}</td>

                      <td className="p-2 border border-slate-200 text-center">Auto</td>
                      
                      {/* Status */}
                      <td className="p-1 border border-slate-200">
                        {isFirstLine && (
                          <select value={t.status} onChange={(e) => handleTicketChange(t.id, 'status', e.target.value)} className={inputClasses}>
                            <option value="TODO">New</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="PAUSED">Paused</option>
                            <option value="DONE">Completed</option>
                            <option value="CLOSED">Closed</option>
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Modal>
  );
}
