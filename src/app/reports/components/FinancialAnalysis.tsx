"use client";

import { useState } from "react";
import { TrendingUp, Users, Target, ArrowUpRight, ArrowDownRight, Info, Wallet, Settings2, Edit3, Save, UserCheck, ChevronUp, ChevronDown } from "lucide-react";

interface FinancialAnalysisProps {
  data: any;
  users: any[];
  rates: {
    userSalaries: Record<string, number>;
    standardMonthlyHours: number;
    revenueMode: "SRO_HOURS" | "PACKAGE";
    packageRevenue: number;
    revenuePerSroHour: number;
  };
  onUpdateRate: (key: string, value: any) => void;
  isRemixMode?: boolean;
  period?: { start: Date; end: Date };
}

export function FinancialAnalysis({ data, period, users, rates, onUpdateRate, isRemixMode = false }: FinancialAnalysisProps) {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [tempSalary, setTempSalary] = useState<number>(0);
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'actual', direction: 'desc' });
  const [remixStrategy, setRemixStrategy] = useState<'REALTIME' | 'LATEST'>('LATEST');

  if (!data) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(val);
  };

  // 1. Calculate Revenue
  let totalRevenue = (data.totalPackageRevenue !== undefined && data.totalPackageRevenue !== null) 
    ? data.totalPackageRevenue 
    : rates.packageRevenue;

  if (isRemixMode && remixStrategy === 'LATEST' && data.packages?.length > 0) {
    // Nhóm các gói theo khách hàng
    const packagesByClient: Record<string, any[]> = {};
    data.packages.forEach((pkg: any) => {
      if (!packagesByClient[pkg.clientId]) packagesByClient[pkg.clientId] = [];
      packagesByClient[pkg.clientId].push(pkg);
    });

    let projectedSum = 0;
    const start = new Date(data.period?.start || new Date());
    const end = new Date(data.period?.end || new Date());

    // Tính tổng số tháng trong TOÀN BỘ kỳ report (ví dụ FY 2025 là 12 tháng)
    const reportStart = new Date(period?.start || new Date());
    const reportEnd = new Date(period?.end || new Date());
    
    // Dùng công thức chuẩn để ra đúng số tháng (ví dụ T4/2025 -> T3/2026 là 12 tháng)
    const totalReportMonths = (reportEnd.getFullYear() - reportStart.getFullYear()) * 12 + (reportEnd.getMonth() - reportStart.getMonth()) + 1;

    Object.entries(packagesByClient).forEach(([clientId, clientPkgs]) => {
      // Lấy giá mới nhất tuyệt đối từ Server
      const latestPrice = data.latestPriceMap?.[clientId] || 0;
      
      // Theo ý sếp A: Áp giá này cho TOÀN BỘ kỳ báo cáo
      projectedSum += (latestPrice / 12) * totalReportMonths;
    });

    totalRevenue = projectedSum;
  }

  // 2. Calculate Blended Rate & Total Cost
  const salaryList = Object.values(rates.userSalaries);
  const totalSalaries = salaryList.reduce((sum, s) => sum + s, 0);
  const userCount = salaryList.length || 1;
  const averageMonthlySalary = totalSalaries / userCount;
  const blendedHourlyRate = averageMonthlySalary > 0 ? (averageMonthlySalary / rates.standardMonthlyHours) : 0;
  
  const totalCost = data.totalActualHours * blendedHourlyRate;
  const profit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;

  const handleSaveSalary = (userId: string) => {
    const newSalaries = { ...rates.userSalaries, [userId]: tempSalary };
    onUpdateRate("userSalaries", newSalaries);
    setEditingUserId(null);
  };

  const sortedPerformance = [...data.sroPerformance].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aVal, bVal;
    if (sortConfig.key === 'cost') {
      const aSal = rates.userSalaries[a.userId] || 0;
      const bSal = rates.userSalaries[b.userId] || 0;
      aVal = a.actual * (aSal / rates.standardMonthlyHours);
      bVal = b.actual * (bSal / rates.standardMonthlyHours);
    } else {
      aVal = a[sortConfig.key];
      bVal = b[sortConfig.key];
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortConfig?.key !== column) return <div className="w-3 h-3 opacity-20"><ChevronDown className="w-3 h-3" /></div>;
    return sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />;
  };

  // KPIs for the header
  const efficiencyRatio = data.totalEstimatedHours > 0 ? (data.totalActualHours / data.totalEstimatedHours) * 100 : 0;
  const resourceUtilization = data.totalMonthlyQuota > 0 ? (data.totalActualHours / data.totalMonthlyQuota) * 100 : 0;
  const slaCompliance = data.slaComplianceRate || 100;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* 1. CONFIGURATION SECTION - USER SALARY MANAGEMENT (TOP) */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div>
              <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
                <Settings2 className="w-6 h-6 text-indigo-600" />
                Cấu hình tài chính (Finance Setup)
              </h2>
              <p className="text-slate-500 text-xs font-medium mt-1">Cài đặt doanh thu gói và lương nhân sự để tính lợi nhuận ròng</p>
            </div>
          </div>
            
            {isRemixMode && (
              <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl gap-1">
                <button 
                  onClick={() => setRemixStrategy('REALTIME')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${remixStrategy === 'REALTIME' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                >
                  PHÂN BỔ THỰC TẾ (ACCRUAL)
                </button>
                <button 
                  onClick={() => setRemixStrategy('LATEST')}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${remixStrategy === 'LATEST' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400'}`}
                >
                  DỰ PHÓNG GÓI MỚI (PROJECTED)
                </button>
              </div>
            )}

            <div className="bg-emerald-50 dark:bg-emerald-900/30 px-6 py-3 rounded-2xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-4">
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Tổng Doanh thu Gói (Hợp đồng):</span>
                <span className="text-xl font-black text-emerald-700 dark:text-emerald-300">{formatCurrency(totalRevenue)}</span>
              </div>
              <div className="h-8 w-px bg-emerald-200 dark:bg-emerald-800" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Phương thức:</span>
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">Fixed Package Price</span>
              </div>
            </div>
            
            <div className="bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-3">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Giờ định mức (Full-time):</label>
              <input 
                type="number" 
                value={rates.standardMonthlyHours} 
                onChange={(e) => onUpdateRate("standardMonthlyHours", Number(e.target.value))}
                className="w-12 bg-transparent text-slate-900 dark:text-white font-black text-sm outline-none border-b border-slate-100 focus:border-indigo-500 transition-all text-center"
              />
            </div>
          </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/30 dark:bg-slate-800/20">
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-2">Nhân sự <SortIcon column="name" /></div>
                </th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">Vai trò</th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('salary')}>
                  <div className="flex items-center gap-2">Lương tháng (VNĐ) <SortIcon column="salary" /></div>
                </th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Giá vốn / giờ</th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {users.map((user: any) => {
                const monthlySalary = rates.userSalaries[user.id] || 0;
                const hourlyRate = monthlySalary > 0 ? (monthlySalary / rates.standardMonthlyHours) : 0;
                const isEditing = editingUserId === user.id;

                return (
                  <tr key={user.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                    <td className="py-5 px-8 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="font-black text-slate-800 dark:text-slate-100">{user.name}</span>
                    </td>
                    <td className="py-5 px-8">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-[9px] font-black text-slate-400 uppercase tracking-widest">
                        {user.role}
                      </span>
                    </td>
                    <td className="py-5 px-8">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                           <input 
                            type="number" 
                            autoFocus
                            value={tempSalary}
                            onChange={(e) => setTempSalary(Number(e.target.value))}
                            className="bg-indigo-50 dark:bg-indigo-900/30 border-none rounded-xl px-4 py-2 text-sm font-black text-indigo-600 dark:text-indigo-400 outline-none w-40"
                          />
                        </div>
                      ) : (
                        <span className="text-sm font-black text-slate-900 dark:text-white">
                          {formatCurrency(monthlySalary)}
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-8 text-center">
                      <div className="flex flex-col items-center">
                        <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(hourlyRate)}/h</span>
                      </div>
                    </td>
                    <td className="py-5 px-8 text-right">
                      {isEditing ? (
                        <button 
                          onClick={() => handleSaveSalary(user.id)}
                          className="bg-emerald-500 text-white p-2 rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setEditingUserId(user.id);
                            setTempSalary(rates.userSalaries[user.id] || 0);
                          }}
                          className="text-slate-400 hover:text-indigo-600 p-2 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. PREMIUM PERFORMANCE HEADER (FUJIFILM STYLE) */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">{data.period?.label} Premium Service Performance</h1>
           <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800/50 text-[10px] font-bold text-slate-500 leading-tight">
              Fujifilm Internal Use Only<br/>
              Disclosed to: Fujifilm Group<br/>
              Prepared by: Antigravity AI (Jan 1, 2026)
           </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2">
           <div className="p-8 border-r border-slate-100 dark:border-slate-800">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-500" />Operational Efficiency & SLA Summary</h3>
              <div className="space-y-1">
                 <div className="flex bg-emerald-600 text-white p-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest">
                    <div className="w-1/2">Key Performance Indicator</div>
                    <div className="w-1/4 text-center">Value</div>
                    <div className="w-1/4 text-right">Description</div>
                 </div>
                 <div className="flex bg-slate-50 dark:bg-slate-800/50 p-4 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-x border-slate-100 dark:border-slate-800">
                    <div className="w-1/2">Average Efficiency Ratio</div>
                    <div className="w-1/4 text-center font-black text-indigo-600">{efficiencyRatio.toFixed(1)}%</div>
                    <div className="w-1/4 text-right text-[9px] text-slate-400">(Actual / Consumed)</div>
                 </div>
                 <div className="flex bg-white dark:bg-slate-900 p-4 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-x border-slate-100 dark:border-slate-800">
                    <div className="w-1/2">Resource Utilization</div>
                    <div className="w-1/4 text-center font-black text-indigo-600">{resourceUtilization.toFixed(1)}%</div>
                    <div className="w-1/4 text-right text-[9px] text-slate-400">(Actual / Contracted)</div>
                 </div>
                 <div className="flex bg-slate-50 dark:bg-slate-800/50 p-4 text-[11px] font-bold text-slate-700 dark:text-slate-300 rounded-b-xl border border-slate-100 dark:border-slate-800">
                    <div className="w-1/2">SLA Compliance Rate</div>
                    <div className="w-1/4 text-center font-black text-emerald-600">{slaCompliance.toFixed(0)}%</div>
                    <div className="w-1/4 text-right text-[9px] text-slate-400">Total requests met deadline</div>
                 </div>
              </div>
           </div>
           <div className="p-8">
              <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6 flex items-center gap-2"><Wallet className="w-4 h-4 text-indigo-500" />Financial Performance</h3>
              <div className="space-y-1">
                 <div className="flex bg-emerald-600 text-white p-3 rounded-t-xl text-[10px] font-black uppercase tracking-widest">
                    <div className="w-1/2">Financial Metric</div>
                    <div className="w-1/4 text-center">Value</div>
                    <div className="w-1/4 text-right">Description</div>
                 </div>
                 <div className="flex bg-slate-50 dark:bg-slate-800/50 p-4 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-x border-slate-100 dark:border-slate-800">
                    <div className="w-1/2">Total Revenue (A)</div>
                    <div className="w-1/4 text-center font-black">{formatCurrency(totalRevenue).replace('đ', '')}</div>
                    <div className="w-1/4 text-right text-[9px] text-slate-400">Premium Service</div>
                 </div>
                 <div className="flex bg-white dark:bg-slate-900 p-4 text-[11px] font-bold text-slate-700 dark:text-slate-300 border-x border-slate-100 dark:border-slate-800">
                    <div className="w-1/2">Total Service Cost (B)</div>
                    <div className="w-1/4 text-center font-black">{formatCurrency(totalCost).replace('đ', '')}</div>
                    <div className="w-1/4 text-right text-[9px] text-slate-400">Direct Labor Cost</div>
                 </div>
                 <div className="flex bg-slate-50 dark:bg-slate-800/50 p-4 text-[11px] font-bold text-emerald-600 border-x border-slate-100 dark:border-slate-800">
                    <div className="w-1/2 font-black">Gross Profit (A - B)</div>
                    <div className="w-1/4 text-center font-black">{formatCurrency(profit).replace('đ', '')}</div>
                    <div className="w-1/4 text-right text-[9px] text-emerald-500/70">Net Gain</div>
                 </div>
                 <div className="flex bg-white dark:bg-slate-900 p-4 text-[11px] font-bold text-emerald-600 rounded-b-xl border border-slate-100 dark:border-slate-800">
                    <div className="w-1/2 font-black">Gross Profit Margin</div>
                    <div className="w-1/4 text-center font-black">{margin.toFixed(1)}%</div>
                    <div className="w-1/4 text-right text-[9px] text-slate-400">(Revenue - Cost) / Revenue</div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* 3. SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-indigo-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl text-indigo-600">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doanh thu</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalRevenue)}</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 dark:bg-rose-950/50 rounded-2xl text-rose-600">
              <Users className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Giá vốn</span>
          </div>
          <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{formatCurrency(totalCost)}</p>
        </div>

        <div className="bg-slate-900 dark:bg-indigo-600 p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 text-indigo-200">
              <div className="p-3 bg-white/10 rounded-2xl">
                <TrendingUp className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Lợi nhuận ròng</span>
            </div>
            <p className="text-3xl font-black text-white tracking-tight">{formatCurrency(profit)}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black flex items-center gap-1 ${profit >= 0 ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                {margin.toFixed(1)}% MARGIN
              </span>
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <TrendingUp className="w-48 h-48 text-white" />
          </div>
        </div>
      </div>

      {/* 4. LABOR BREAKDOWN TABLE WITH SORTING */}
      <div className="bg-white dark:bg-slate-900 rounded-[40px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Chi tiết hiệu quả nhân sự (Labor Efficiency)
          </h3>
          <p className="text-[9px] font-black text-slate-400 uppercase">* Bấm vào tiêu đề bảng để sắp xếp nhanh</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => requestSort('name')}>
                  <div className="flex items-center gap-2">Nhân sự <SortIcon column="name" /></div>
                </th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors text-right" onClick={() => requestSort('actual')}>
                  <div className="flex items-center justify-end gap-2 text-right">Giờ thực tế <SortIcon column="actual" /></div>
                </th>
                <th className="py-4 px-8 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Chi phí (Trung bình)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
              {sortedPerformance.map((sro: any, idx: number) => {
                const monthlySalary = rates.userSalaries[sro.userId] || 0;
                const hourlyRate = monthlySalary > 0 ? (monthlySalary / rates.standardMonthlyHours) : 0;
                const sroTotalCost = sro.actual * hourlyRate;

                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all">
                    <td className="py-5 px-8 font-black text-slate-800 dark:text-slate-100">{sro.name}</td>
                    <td className="py-5 px-8 font-bold text-slate-600 dark:text-slate-400 text-right">{sro.actual.toFixed(1)}h</td>
                    <td className="py-5 px-8 font-black text-slate-900 dark:text-white text-right">{formatCurrency(sro.actual * blendedHourlyRate)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
