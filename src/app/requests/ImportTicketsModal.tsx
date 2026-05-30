"use client";

import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { Upload, Download, FileSpreadsheet, AlertCircle, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { importTicketsBulk } from "@/actions/import-tickets";
import { useRouter } from "next/navigation";

export function ImportTicketsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<{ success: number, errors: string[] } | null>(null);
  const router = useRouter();

  const handleDownloadTemplate = async () => {
    try {
      const ExcelJS = (await import("exceljs")).default || await import("exceljs");
      const { saveAs } = await import("file-saver");
      
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Import Template");
      
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
      
      worksheet.columns.forEach((column) => { column.width = 25; });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Import_Tickets_Template.xlsx`);
    } catch (error) {
      console.error(error);
      toast.error("Failed to download template.");
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResults(null);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    startTransition(async () => {
      try {
        const ExcelJS = (await import("exceljs")).default || await import("exceljs");
        const workbook = new ExcelJS.Workbook();
        const arrayBuffer = await file.arrayBuffer();
        await workbook.xlsx.load(arrayBuffer);
        
        const worksheet = workbook.worksheets[0];
        if (!worksheet) {
          toast.error("No worksheet found in file.");
          return;
        }

        const headers: string[] = [];
        const rows: any[] = [];

        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) {
            row.eachCell((cell, colNumber) => {
              headers[colNumber] = cell.value?.toString().trim() || `Col${colNumber}`;
            });
          } else {
            const rowData: any = {};
            row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
              const header = headers[colNumber];
              if (header) {
                // handle formula or rich text
                if (cell.value && typeof cell.value === 'object') {
                  if ('result' in cell.value) {
                    rowData[header] = cell.value.result;
                  } else if ('text' in cell.value) {
                    rowData[header] = cell.value.text;
                  } else {
                    rowData[header] = cell.value;
                  }
                } else {
                  rowData[header] = cell.value;
                }
              }
            });
            // Only add if there is at least some data (e.g. Customer Code or Ticket Title)
            if (rowData["Customer Code"] || rowData["Ticket Title"]) {
              rows.push(rowData);
            }
          }
        });

        if (rows.length === 0) {
          toast.error("No valid data rows found in file.");
          return;
        }

        const res = await importTicketsBulk(rows);
        if (res.error) {
          toast.error(res.error);
        } else if (res.data) {
          setResults(res.data);
          if (res.data.success > 0) {
            toast.success(`Successfully imported ${res.data.success} tickets!`);
            router.refresh();
          }
        }
      } catch (error) {
        console.error(error);
        toast.error("An error occurred during import.");
      }
    });
  };

  const handleClose = () => {
    setFile(null);
    setResults(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Import Tickets from Excel" maxWidth="max-w-2xl">
      <div className="space-y-6">
        
        {!results ? (
          <>
            <div className="bg-indigo-50 dark:bg-indigo-950/30 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300">Step 1: Get the Template</h4>
                <p className="text-xs text-indigo-700/80 dark:text-indigo-400/80 mt-1">Download the standard 48-column Excel template for importing.</p>
              </div>
              <button
                onClick={handleDownloadTemplate}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300 rounded-xl text-xs font-bold border border-indigo-200 dark:border-indigo-800 shadow-sm hover:bg-indigo-50 transition-colors shrink-0"
              >
                <Download className="w-4 h-4" />
                Download Template
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">Step 2: Upload Data</h4>
                <p className="text-xs text-slate-500 mt-1">Select your filled Excel file. Make sure the Customer Code matches existing clients in the system exactly.</p>
              </div>
              
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-8 bg-white dark:bg-slate-950 relative hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <FileSpreadsheet className="w-10 h-10 text-slate-400 mb-3" />
                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                  {file ? file.name : "Click or drag file to upload"}
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  {file ? `${(file.size / 1024).toFixed(1)} KB` : "Supports .xlsx, .csv"}
                </span>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleImport}
                  disabled={!file || isPending}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isPending ? "Importing..." : "Start Import"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 p-5 rounded-2xl border border-emerald-100 dark:border-emerald-900/30">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 shrink-0" />
              <div>
                <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-400">Import Process Completed</h3>
                <p className="text-sm text-emerald-600 dark:text-emerald-500 font-medium">Successfully imported {results.success} tickets into the system.</p>
              </div>
            </div>
            
            {results.errors.length > 0 && (
              <div className="bg-rose-50 dark:bg-rose-900/20 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/30 space-y-3">
                <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
                  <AlertCircle className="w-5 h-5" />
                  <h4>{results.errors.length} Rows Failed to Import</h4>
                </div>
                <div className="max-h-48 overflow-y-auto space-y-1.5 p-2 bg-white/50 dark:bg-slate-950/50 rounded-xl">
                  {results.errors.map((err, idx) => (
                    <div key={idx} className="text-xs text-rose-600 dark:text-rose-400 font-medium p-2 border-b border-rose-100 dark:border-rose-900/30 last:border-0">
                      {err}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-rose-500 uppercase tracking-widest font-bold pt-1">
                  Please fix these errors in your file and try importing them again.
                </p>
              </div>
            )}
            
            <div className="flex justify-end pt-4">
              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-colors"
              >
                Close & View Tickets
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
