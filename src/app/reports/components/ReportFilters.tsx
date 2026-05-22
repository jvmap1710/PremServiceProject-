"use client";

import { Search, Calendar, User, Filter } from "lucide-react";

interface ReportFiltersProps {
  clients: any[];
  selectedClientId: string;
  setSelectedClientId: (id: string) => void;
  yearStart: number;
  setYearStart: (y: number) => void;
  yearEnd: number;
  setYearEnd: (y: number) => void;
  periodType: "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";
  setPeriodType: (t: "MONTH" | "QUARTER" | "YEAR" | "CUSTOM") => void;
  periodValueStart: number;
  setPeriodValueStart: (v: number) => void;
  periodValueEnd: number;
  setPeriodValueEnd: (v: number) => void;
  customStart: string;
  setCustomStart: (s: string) => void;
  customEnd: string;
  setCustomEnd: (e: string) => void;
}

export function ReportFilters({
  clients,
  selectedClientId,
  setSelectedClientId,
  yearStart,
  setYearStart,
  yearEnd,
  setYearEnd,
  periodType,
  setPeriodType,
  periodValueStart,
  setPeriodValueStart,
  periodValueEnd,
  setPeriodValueEnd,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd
}: ReportFiltersProps) {
  const years = [2024, 2025, 2026];
  const months = Array.from({ length: 12 }, (_, i) => ({ v: i + 1, l: `Month ${i + 1}` }));
  const quarters = [1, 2, 3, 4].map(v => ({ v, l: `Quarter ${v}` }));

  const handleYearStartChange = (newYear: number) => {
    setYearStart(newYear);
    if (yearEnd < newYear) {
      setYearEnd(newYear);
    }
  };

  const handlePeriodValueStartChange = (newVal: number) => {
    setPeriodValueStart(newVal);
    if (yearStart === yearEnd && periodValueEnd < newVal) {
      setPeriodValueEnd(newVal);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-6 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4">
      {/* Client Filter */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <User className="w-4 h-4 text-slate-400" />
        <select 
          value={selectedClientId}
          onChange={(e) => setSelectedClientId(e.target.value)}
          className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
        >
          <option value="all" className="dark:bg-slate-900">All Clients</option>
          {clients.map(c => (
            <option key={c.id} value={c.id} className="dark:bg-slate-900">{c.name}</option>
          ))}
        </select>
      </div>

      {/* Period Type */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
        <Filter className="w-4 h-4 text-slate-400" />
        <select 
          value={periodType}
          onChange={(e) => {
            setPeriodType(e.target.value as any);
            setPeriodValueStart(1);
            setPeriodValueEnd(1);
          }}
          className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
        >
          <option value="MONTH" className="dark:bg-slate-900">By Month Range</option>
          <option value="QUARTER" className="dark:bg-slate-900">By Quarter Range</option>
          <option value="YEAR" className="dark:bg-slate-900">By Year Range</option>
          <option value="CUSTOM" className="dark:bg-slate-900">Custom Range (From-To)</option>
        </select>
      </div>

      {/* Custom Range Inputs */}
      {periodType === "CUSTOM" ? (
        <div className="flex items-center gap-4 animate-in slide-in-from-left-2 duration-300">
           <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase">From</span>
            <input 
              type="date" 
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase">To</span>
            <input 
              type="date" 
              value={customEnd}
              min={customStart}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none"
            />
          </div>
        </div>
      ) : (
        <>
          {/* FROM */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase">From</span>
            {periodType !== "YEAR" && (
              <select 
                value={periodValueStart}
                onChange={(e) => handlePeriodValueStartChange(parseInt(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                {periodType === "MONTH" ? (
                  months.map(m => <option key={m.v} value={m.v} className="dark:bg-slate-900">{m.l}</option>)
                ) : (
                  quarters.map(q => <option key={q.v} value={q.v} className="dark:bg-slate-900">{q.l}</option>)
                )}
              </select>
            )}
            <select 
              value={yearStart}
              onChange={(e) => handleYearStartChange(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
            >
              {years.map(y => (
                <option key={y} value={y} className="dark:bg-slate-900">{y}</option>
              ))}
            </select>
          </div>

          {/* TO */}
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-black text-slate-400 uppercase">To</span>
            {periodType !== "YEAR" && (
              <select 
                value={periodValueEnd}
                onChange={(e) => setPeriodValueEnd(parseInt(e.target.value))}
                className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
              >
                {periodType === "MONTH" ? (
                  months.map(m => (
                    <option 
                      key={m.v} 
                      value={m.v} 
                      disabled={yearEnd === yearStart && m.v < periodValueStart}
                      className="dark:bg-slate-900"
                    >
                      {m.l}
                    </option>
                  ))
                ) : (
                  quarters.map(q => (
                    <option 
                      key={q.v} 
                      value={q.v} 
                      disabled={yearEnd === yearStart && q.v < periodValueStart}
                      className="dark:bg-slate-900"
                    >
                      {q.l}
                    </option>
                  ))
                )}
              </select>
            )}
            <select 
              value={yearEnd}
              onChange={(e) => setYearEnd(parseInt(e.target.value))}
              className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none cursor-pointer disabled:opacity-50"
            >
              {years.map(y => (
                <option 
                  key={y} 
                  value={y} 
                  disabled={y < yearStart}
                  className={y < yearStart ? "text-slate-400 bg-slate-50 dark:bg-slate-900" : "dark:bg-slate-900"}
                >
                  {y}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </div>
  );
}
