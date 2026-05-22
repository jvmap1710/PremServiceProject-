"use client";

import { useState } from "react";
import { Calendar, Clock, ShieldCheck, ChevronDown, ChevronUp, SlidersHorizontal, Package, ArrowUpDown } from "lucide-react";
import { PackageForm } from "./PackageForm";
import { RuleForm } from "./RuleForm";
import { DeleteRuleButton } from "./DeleteRuleButton";

interface Rule {
  id: string;
  taskName: string;
  estimateHours: number;
  requestsPerMonth: number;
  scope: string | null;
  exclusions: string | null;
  packageId: string;
  notes?: string | null;
}

interface PremiumPackage {
  id: string;
  name: string;
  validFrom: Date | string;
  validTo: Date | string;
  isActive: boolean;
  monthlyPrice: number;
  monthlyQuota: number | null;
  clientId: string;
  sroRules: Rule[];
}

export function PackagesList({
  packages,
  clientId,
}: {
  packages: PremiumPackage[];
  clientId: string;
}) {
  const [onlyActive, setOnlyActive] = useState(false);
  const [sortBy, setSortBy] = useState("validFromDesc");
  const [expandedPkgs, setExpandedPkgs] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string) => {
    setExpandedPkgs((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = (expand: boolean) => {
    const newState: Record<string, boolean> = {};
    if (expand) {
      packages.forEach((pkg) => {
        newState[pkg.id] = true;
      });
    }
    setExpandedPkgs(newState);
  };

  // 1. Filter
  const filteredPackages = packages.filter((pkg) => {
    if (onlyActive && !pkg.isActive) return false;
    return true;
  });

  // 2. Sort: Prioritize Active packages first, then date
  const sortedPackages = [...filteredPackages].sort((a, b) => {
    if (a.isActive && !b.isActive) return -1;
    if (!a.isActive && b.isActive) return 1;

    const dateA = new Date(a.validFrom).getTime();
    const dateB = new Date(b.validFrom).getTime();
    const toA = new Date(a.validTo).getTime();
    const toB = new Date(b.validTo).getTime();

    if (sortBy === "validFromDesc") return dateB - dateA;
    if (sortBy === "validFromAsc") return dateA - dateB;
    if (sortBy === "validToDesc") return toB - toA;
    if (sortBy === "validToAsc") return toA - toB;
    return 0;
  });

  return (
    <div className="space-y-6">
      {/* Sleek Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/80 dark:bg-slate-900/60 backdrop-blur-md p-5 rounded-[28px] border border-slate-200 dark:border-slate-800 shadow-inner">
        {/* Left Side: Filter and Expand/Collapse actions */}
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-3 cursor-pointer group bg-white dark:bg-slate-950 px-5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all active:scale-98">
            <input
              type="checkbox"
              checked={onlyActive}
              onChange={(e) => setOnlyActive(e.target.checked)}
              className="w-5 h-5 rounded-lg border-slate-300 dark:border-slate-700 text-indigo-600 focus:ring-indigo-500 dark:bg-slate-900"
            />
            <span className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">
              Only show active packages
            </span>
          </label>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleAll(true)}
              className="text-[10px] font-black uppercase tracking-widest bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3.5 py-2 rounded-xl transition-all"
            >
              Expand All
            </button>
            <button
              onClick={() => toggleAll(false)}
              className="text-[10px] font-black uppercase tracking-widest bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3.5 py-2 rounded-xl transition-all"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Right Side: Sorting select options */}
        <div className="flex items-center gap-3 bg-white dark:bg-slate-950 px-4 py-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm max-w-xs md:max-w-none">
          <ArrowUpDown className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
          <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest hidden sm:inline">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer pr-4"
          >
            <option value="validFromDesc" className="dark:bg-slate-900">Start Date (Newest → Oldest)</option>
            <option value="validFromAsc" className="dark:bg-slate-900">Start Date (Oldest → Newest)</option>
            <option value="validToDesc" className="dark:bg-slate-900">End Date (Newest → Oldest)</option>
            <option value="validToAsc" className="dark:bg-slate-900">End Date (Oldest → Newest)</option>
          </select>
        </div>
      </div>

      {/* Accordion List Container */}
      <div className="space-y-4">
        {sortedPackages.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 p-16 rounded-[40px] border border-slate-200 dark:border-slate-800 text-center shadow-sm flex flex-col items-center gap-4">
            <div className="w-20 h-20 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center border border-slate-100 dark:border-slate-800">
              <Package className="w-10 h-10 text-slate-200 dark:text-slate-700 animate-pulse" />
            </div>
            <div className="max-w-xs">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">No packages found</h3>
              <p className="text-slate-400 dark:text-slate-500 text-sm">
                {onlyActive ? "No active service packages found." : "Create the first Premium package to start."}
              </p>
            </div>
          </div>
        ) : (
          sortedPackages.map((pkg) => {
            const isExpanded = !!expandedPkgs[pkg.id];
            return (
              <div
                key={pkg.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md dark:hover:shadow-indigo-950/10 transition-all duration-300 overflow-hidden flex flex-col group/pkg"
              >
                {/* Slim list header representing the package */}
                <div 
                  onClick={() => toggleExpand(pkg.id)}
                  className="p-5 md:p-6 flex flex-col lg:grid lg:grid-cols-12 lg:items-center gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                >
                  {/* Left part: toggle chevron, package name, status */}
                  <div className="flex items-center gap-4 min-w-0 lg:col-span-4">
                    <button className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0">
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                    
                    <div className="flex items-center gap-3 min-w-0 flex-wrap sm:flex-nowrap">
                      <h3 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight truncate">
                        {pkg.name}
                      </h3>
                      {pkg.isActive ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30 shrink-0">
                          Active
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                          Expired
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle part: metadata columns formatted nicely inline (flex on mobile, grid columns on desktop via display: contents) */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 text-slate-500 dark:text-slate-400 lg:contents">
                    <div className="flex items-center gap-2 text-xs lg:col-span-3">
                      <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {new Date(pkg.validFrom).toLocaleDateString("en-US")} - {new Date(pkg.validTo).toLocaleDateString("en-US")}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs lg:col-span-2">
                      <Clock className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                      <span className="font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {pkg.monthlyQuota || 0}h/month
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100/50 dark:border-emerald-900/10 px-3 py-1 rounded-xl lg:col-span-2 justify-self-start">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span className="font-black text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(pkg.monthlyPrice || 0)}
                      </span>
                    </div>
                  </div>

                  {/* Right part: Action controls */}
                  <div 
                    onClick={(e) => e.stopPropagation()} // Prevent expand when editing
                    className="flex items-center gap-2 shrink-0 lg:col-span-1 lg:justify-end"
                  >
                    <PackageForm clientId={clientId} initialData={pkg} />
                  </div>
                </div>

                {/* Expanded Details section containing standard requests */}
                {isExpanded && (
                  <div className="p-6 md:p-8 bg-slate-50/30 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex items-center justify-between mb-6 gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-1.5 h-5 bg-indigo-600 dark:bg-indigo-500 rounded-full shrink-0" />
                        <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 uppercase tracking-widest truncate">
                          Standard Requests Category
                        </h4>
                      </div>
                      <div className="shrink-0">
                        <RuleForm packageId={pkg.id} />
                      </div>
                    </div>

                    {pkg.sroRules.length === 0 ? (
                      <div className="p-8 rounded-[20px] border-2 border-dashed border-slate-200 dark:border-slate-800 flex items-center justify-center bg-white dark:bg-slate-950">
                        <p className="text-xs text-slate-400 dark:text-slate-500 italic">No categories configured yet.</p>
                      </div>
                    ) : (
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pkg.sroRules.map((rule) => (
                          <li
                            key={rule.id}
                            className="p-5 rounded-[20px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex flex-col gap-3 relative group/rule hover:shadow-md hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all duration-300 min-w-0"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm flex-1 min-w-0 leading-snug tracking-tight">
                                {rule.taskName}
                              </span>
                              <div className="flex items-center gap-1 opacity-0 group-hover/rule:opacity-100 transition-all translate-x-2 group-hover/rule:translate-x-0 shrink-0">
                                <RuleForm packageId={pkg.id} initialData={rule} />
                                <DeleteRuleButton id={rule.id} packageId={pkg.id} />
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 items-center">
                              <span className="text-indigo-700 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-0.5 rounded-full border border-indigo-100 dark:border-indigo-900/30 font-black text-[9px] uppercase tracking-widest whitespace-nowrap">
                                {rule.requestsPerMonth || 0} req / month
                              </span>
                              <span className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-0.5 rounded-full text-[9px] font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                                Quota: {rule.estimateHours || 0}h / SRO
                              </span>
                              <span className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest whitespace-nowrap shadow-sm">
                                Total: {Math.round((rule.estimateHours || 0) * (rule.requestsPerMonth || 0))}h
                              </span>
                            </div>

                            {(rule.scope || rule.exclusions) && (
                              <div className="mt-1 space-y-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-inner">
                                {rule.scope && (
                                  <div className="flex gap-2">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-0.5 shrink-0">Scope:</span>
                                    <span className="text-xs text-slate-600 dark:text-slate-300 leading-normal">{rule.scope}</span>
                                  </div>
                                )}
                                {rule.exclusions && (
                                  <div className="flex gap-2">
                                    <span className="text-[9px] font-black text-red-400 dark:text-red-500/80 uppercase tracking-widest mt-0.5 shrink-0">Excl:</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400 italic leading-normal">{rule.exclusions}</span>
                                  </div>
                                )}
                              </div>
                            )}

                            {rule.notes && (
                              <div className="flex gap-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100/30 dark:border-indigo-900/10 p-2.5 rounded-xl shadow-inner mt-2">
                                <span className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-0.5 shrink-0">Note:</span>
                                <span className="text-xs text-slate-600 dark:text-slate-300 italic font-bold leading-normal">{rule.notes}</span>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
