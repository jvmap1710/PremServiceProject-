"use client";

import { useState, useEffect, useTransition } from "react";
import { 
  Calendar as CalendarIcon, Plus, Trash2, Copy, 
  ArrowLeft, Loader2, CalendarRange, Sparkles, CheckCircle2 
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import { 
  getHolidays, 
  addHoliday, 
  deleteHoliday, 
  copyHolidaysFromYear, 
  bulkAddHolidays 
} from "@/actions/holiday";

interface HolidayData {
  id: string;
  date: Date;
  name: string;
  year: number;
}

export default function HolidaysConfigPage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [holidays, setHolidays] = useState<HolidayData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Add form state
  const [newHoliday, setNewHoliday] = useState({
    date: "",
    name: ""
  });

  // Load holidays for selected year
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getHolidays(selectedYear);
        setHolidays(data as any);
      } catch (err: any) {
        toast.error("Failed to load holidays");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedYear]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHoliday.date || !newHoliday.name.trim()) {
      toast.error("Please fill in both date and name");
      return;
    }

    startTransition(async () => {
      const res = await addHoliday(newHoliday.date, newHoliday.name.trim());
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Holiday added successfully");
        setNewHoliday({ date: "", name: "" });
        // Reload
        const data = await getHolidays(selectedYear);
        setHolidays(data as any);
      }
    });
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this holiday?")) return;

    startTransition(async () => {
      const res = await deleteHoliday(id);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success("Holiday deleted successfully");
        // Reload
        const data = await getHolidays(selectedYear);
        setHolidays(data as any);
      }
    });
  };

  const handleCopy = async () => {
    const sourceYear = selectedYear - 1;
    if (!confirm(`Copy all holidays from ${sourceYear} to ${selectedYear}?`)) return;

    startTransition(async () => {
      const res = await copyHolidaysFromYear(sourceYear, selectedYear);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Copied ${res.count} holidays from ${sourceYear}`);
        // Reload
        const data = await getHolidays(selectedYear);
        setHolidays(data as any);
      }
    });
  };

  const handleBulkAddStandard = async () => {
    if (!confirm(`Import standard public holidays for Vietnam for the year ${selectedYear}?`)) return;

    const stdHolidays = [
      { date: `${selectedYear}-01-01`, name: "New Year's Day" },
      { date: `${selectedYear}-04-30`, name: "Reunification Day" },
      { date: `${selectedYear}-05-01`, name: "International Labor Day" },
      { date: `${selectedYear}-09-02`, name: "National Day" },
      { date: `${selectedYear}-09-03`, name: "National Day Holiday (Extra)" }
    ];

    startTransition(async () => {
      const res = await bulkAddHolidays(stdHolidays);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Imported ${res.count} standard holidays`);
        // Reload
        const data = await getHolidays(selectedYear);
        setHolidays(data as any);
      }
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/settings" 
          className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Holiday Calendar</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">Configure company holidays to exclude them from SLA calculations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* LEFT / MAIN COLUMN: HOLIDAY LIST (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="px-8 py-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <CalendarRange className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wider">Holidays List</h3>
              </div>
              
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/20"
                >
                  {Array.from({ length: 7 }, (_, i) => currentYear - 3 + i).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-8">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
              ) : holidays.length === 0 ? (
                <div className="text-center py-20 text-slate-400 space-y-4">
                  <CalendarIcon className="w-16 h-16 mx-auto opacity-20" />
                  <p className="text-sm font-medium">No holidays registered for {selectedYear}</p>
                  <div className="flex gap-2 justify-center pt-4">
                    <button
                      onClick={handleCopy}
                      disabled={isPending}
                      className="px-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-850 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 inline-flex items-center gap-2 transition-all"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      Copy from {selectedYear - 1}
                    </button>
                    <button
                      onClick={handleBulkAddStandard}
                      disabled={isPending}
                      className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/20 rounded-xl text-xs font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-2 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      Import Standard VN Holidays
                    </button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 pl-4">Date</th>
                        <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Holiday Name</th>
                        <th className="text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4 text-right pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                      {holidays.map((h) => (
                        <tr key={h.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-950/30 transition-colors">
                          <td className="py-4 pl-4 text-sm font-bold text-slate-800 dark:text-slate-200">
                            {format(new Date(h.date), "EEEE, dd/MM/yyyy")}
                          </td>
                          <td className="py-4 text-sm font-semibold text-slate-600 dark:text-slate-400">
                            {h.name}
                          </td>
                          <td className="py-4 text-right pr-4">
                            <button
                              onClick={() => handleDelete(h.id)}
                              disabled={isPending}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
                              title="Delete Holiday"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ACTIONS / ADD FORM (1/3) */}
        <div className="space-y-6">
          {/* Add Holiday Card */}
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">Add New Holiday</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Register a specific date</p>
            </div>

            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Holiday Date</label>
                <input
                  type="date"
                  value={newHoliday.date}
                  onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Holiday Name</label>
                <input
                  type="text"
                  placeholder="e.g. New Year's Day"
                  value={newHoliday.name}
                  onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl text-sm font-semibold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-md disabled:opacity-50"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add Holiday
              </button>
            </form>
          </div>

          {/* Quick Import Tools */}
          {holidays.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[32px] border border-slate-150 dark:border-slate-850 space-y-6">
              <div>
                <h3 className="text-sm font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">Quick Actions</h3>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Calendar maintenance tools</p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={handleCopy}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 text-slate-700 dark:text-slate-350 rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  Copy from {selectedYear - 1}
                </button>
                
                <button
                  onClick={handleBulkAddStandard}
                  disabled={isPending}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900/30 hover:bg-indigo-100/50 text-indigo-700 dark:text-indigo-400 rounded-2xl text-xs font-black uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4" />
                  Import Standard VN Holidays
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
