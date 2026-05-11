"use client";

import { useState, useEffect } from "react";
import { ReportFilters } from "./ReportFilters";
import { ComparisonCards } from "./ComparisonCards";
import { getTASOperationalReports, PeriodType, getFinancialSettings, updateFinancialSettings } from "@/actions/analytics";
import { Loader2 } from "lucide-react";
import { DoneRateChart, TypeDistributionChart, ComparisonChart, TrendChart } from "./ReportCharts";
import { ExportButton } from "./ExportButton";
import { SROPerformanceTable } from "./SROPerformanceTable";
import { SROUsageTable } from "./SROUsageTable";
import { FinancialAnalysis } from "./FinancialAnalysis";

export function ReportDashboard({ clients, users, userRole }: { clients: any[], users: any[], userRole?: string }) {
  const [selectedClientId, setSelectedClientId] = useState<string>("all");
  const [yearStart, setYearStart] = useState<number>(new Date().getFullYear());
  const [yearEnd, setYearEnd] = useState<number>(new Date().getFullYear());
  const [periodType, setPeriodType] = useState<PeriodType>("MONTH");
  const [periodValueStart, setPeriodValueStart] = useState<number>(new Date().getMonth() + 1);
  const [periodValueEnd, setPeriodValueEnd] = useState<number>(new Date().getMonth() + 1);
  const [customStart, setCustomStart] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [customEnd, setCustomEnd] = useState<string>(new Date().toISOString().split('T')[0]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [financialRates, setFinancialRates] = useState({
    userSalaries: {} as Record<string, number>,
    standardMonthlyHours: 176,
    revenueMode: "PACKAGE" as "SRO_HOURS" | "PACKAGE",
    revenuePerSroHour: 0,
    packageRevenue: 0
  });

  useEffect(() => {
    async function loadSettings() {
      const settings = await getFinancialSettings();
      setFinancialRates(prev => ({ ...prev, ...settings }));
    }
    loadSettings();

    // Load Filters
    const savedFilters = localStorage.getItem("report_filters");
    if (savedFilters) {
      const f = JSON.parse(savedFilters);
      if (f.selectedClientId) setSelectedClientId(f.selectedClientId);
      if (f.yearStart) setYearStart(f.yearStart);
      if (f.yearEnd) setYearEnd(f.yearEnd);
      if (f.periodType) setPeriodType(f.periodType);
      if (f.periodValueStart) setPeriodValueStart(f.periodValueStart);
      if (f.periodValueEnd) setPeriodValueEnd(f.periodValueEnd);
      if (f.customStart) setCustomStart(f.customStart);
      if (f.customEnd) setCustomEnd(f.customEnd);
    }
  }, []);

  useEffect(() => {
    const filters = {
      selectedClientId,
      yearStart,
      yearEnd,
      periodType,
      periodValueStart,
      periodValueEnd,
      customStart,
      customEnd
    };
    localStorage.setItem("report_filters", JSON.stringify(filters));
  }, [selectedClientId, yearStart, yearEnd, periodType, periodValueStart, periodValueEnd, customStart, customEnd]);

  const updateFinancialRate = async (key: string, value: any) => {
    const newRates = { ...financialRates, [key]: value };
    setFinancialRates(newRates as any);
    
    // Lưu vào DB
    if (key === 'userSalaries') {
      await updateFinancialSettings({ userSalaries: value });
    } else {
      await updateFinancialSettings({ [key]: value });
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const result = await getTASOperationalReports(
        selectedClientId, 
        yearStart, 
        yearEnd,
        periodValueStart, 
        periodValueEnd,
        periodType,
        periodType === "CUSTOM" ? new Date(customStart) : undefined,
        periodType === "CUSTOM" ? new Date(customEnd) : undefined
      );
      setData(result);
      setLoading(false);
    }
    fetchData();
  }, [selectedClientId, yearStart, yearEnd, periodType, periodValueStart, periodValueEnd, customStart, customEnd]);

  const [activeTab, setActiveTab] = useState<"OVERVIEW" | "COMPARISON" | "OPTIMIZATION" | "FINANCIAL" | "REMIX">("OVERVIEW");

  useEffect(() => {
    const savedTab = localStorage.getItem("report_active_tab");
    if (savedTab && ["OVERVIEW", "COMPARISON", "OPTIMIZATION", "FINANCIAL", "REMIX"].includes(savedTab)) {
      setActiveTab(savedTab as any);
    }
  }, []);

  const handleTabChange = (tab: "OVERVIEW" | "COMPARISON" | "OPTIMIZATION" | "FINANCIAL" | "REMIX") => {
    setActiveTab(tab);
    localStorage.setItem("report_active_tab", tab);
  };

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Top Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Báo cáo vận hành Premium Service</h1>
          <p className="text-slate-500 font-medium text-sm">Phân tích dữ liệu và hiệu suất dịch vụ cấp cao</p>
        </div>
        <ExportButton 
          data={data} 
          periodLabel={data?.period?.label || ""} 
          userRole={userRole}
          financialRates={financialRates}
        />
      </div>

      {/* Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <ReportFilters 
          clients={clients}
          selectedClientId={selectedClientId}
          setSelectedClientId={setSelectedClientId}
          yearStart={yearStart}
          setYearStart={setYearStart}
          yearEnd={yearEnd}
          setYearEnd={setYearEnd}
          periodType={periodType}
          setPeriodType={setPeriodType}
          periodValueStart={periodValueStart}
          setPeriodValueStart={setPeriodValueStart}
          periodValueEnd={periodValueEnd}
          setPeriodValueEnd={setPeriodValueEnd}
          customStart={customStart}
          setCustomStart={setCustomStart}
          customEnd={customEnd}
          setCustomEnd={setCustomEnd}
        />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 w-fit rounded-2xl">
        <button
          onClick={() => handleTabChange("OVERVIEW")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === "OVERVIEW" 
            ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
          }`}
        >
          TỔNG QUAN
        </button>
        <button
          onClick={() => handleTabChange("COMPARISON")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === "COMPARISON" 
            ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
          }`}
        >
          SO SÁNH
        </button>
        <button
          onClick={() => handleTabChange("OPTIMIZATION")}
          className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
            activeTab === "OPTIMIZATION" 
            ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm" 
            : "text-slate-500 hover:text-slate-700"
          }`}
        >
          TỐI ƯU
        </button>
        {(userRole === "ADMIN" || userRole === "MANAGER") && (
          <button
            onClick={() => handleTabChange("FINANCIAL")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === "FINANCIAL" 
              ? "bg-slate-900 dark:bg-indigo-600 text-white shadow-xl scale-105" 
              : "text-rose-500 hover:text-rose-700 font-bold"
            }`}
          >
            TÀI CHÍNH 💰
          </button>
        )}
        {(userRole === "ADMIN" || userRole === "MANAGER") && (
          <button
            onClick={() => handleTabChange("REMIX")}
            className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all ${
              activeTab === "REMIX" 
              ? "bg-indigo-600 text-white shadow-xl scale-105" 
              : "text-indigo-500 hover:text-indigo-700 font-bold"
            }`}
          >
            HỢP NHẤT CHIẾN LƯỢC ✨
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-40 space-y-4">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Đang tổng hợp dữ liệu...</p>
        </div>
      ) : data ? (
        <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <ComparisonCards data={data} />
          
          {activeTab === "OVERVIEW" ? (
            <div className="space-y-8">
              <div className="px-2 border-l-4 border-blue-600 pl-4">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Thống kê chi tiết ({data.period.label})</h3>
                <p className="text-slate-500 text-sm font-medium">Phân bổ ticket và hiệu suất xử lý trong kỳ</p>
              </div>

              {/* Trend Chart */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="mb-6">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">Biểu đồ xu hướng (Trend)</h4>
                  <p className="text-xs text-slate-500">Số lượng Ticket và Giờ làm thực tế qua từng tháng</p>
                </div>
                <TrendChart data={data.current.trendData} />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Trạng thái Ticket</h4>
                  <DoneRateChart data={data} />
                  <div className="mt-4 text-center">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{data.current.completionRate.toFixed(1)}%</span>
                    <p className="text-sm text-slate-500">Tỷ lệ hoàn thành trong kỳ</p>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-6">Phân loại Yêu cầu</h4>
                  <TypeDistributionChart data={data} />
                </div>
              </div>

              {/* SRO Performance Table */}
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">HIỆU SUẤT NHÂN SỰ (SRO)</h3>
                    <p className="text-slate-500 text-sm font-medium">Đối soát Dự toán (Est) vs Thực tế (Act) từng nhân sự</p>
                  </div>
                  <span className="text-[10px] font-black bg-blue-50 text-blue-600 px-3 py-1 rounded-full uppercase tracking-widest">Efficiency View</span>
                </div>
                <SROPerformanceTable data={data.current.sroPerformance} />
              </div>
            </div>
          ) : activeTab === "COMPARISON" ? (
            <div className="space-y-8">
              {/* Comparative Growth Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <GrowthCard 
                  title="Tăng trưởng Ticket" 
                  qoq={data.comparison.qoq.ticketsChange} 
                  yoy={data.comparison.yoy.ticketsChange}
                />
                <GrowthCard 
                  title="Biến động Giờ (Act)" 
                  qoq={data.comparison.qoq.hoursChange} 
                  yoy={data.comparison.yoy.hoursChange}
                  color="emerald"
                />
                <GrowthCard 
                  title="Hiệu suất xử lý" 
                  qoq={data.comparison.qoq.completionRateChange || 0} 
                  yoy={data.comparison.yoy.completionRateChange || 0}
                  color="indigo"
                />
              </div>

              <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="mb-8 px-2 border-l-4 border-blue-600 pl-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Biểu đồ so sánh hiệu suất</h3>
                  <p className="text-slate-500 text-sm font-medium">So sánh Kỳ này vs Kỳ trước (QoQ) vs Cùng kỳ năm ngoái (YoY)</p>
                </div>
                <ComparisonChart data={data} />
              </div>
            </div>
          ) : activeTab === "OPTIMIZATION" ? (
            <div className="space-y-8">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="mb-8 px-2 border-l-4 border-amber-500 pl-4">
                  <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Phân tích hiệu quả danh mục SRO</h3>
                  <p className="text-slate-500 text-sm font-medium">Đối soát tần suất sử dụng thực tế để tối ưu hợp đồng năm tới</p>
                </div>
                <SROUsageTable data={data.current.sroUsageAnalysis} />
              </div>
            </div>
          ) : activeTab === "FINANCIAL" ? (
            <FinancialAnalysis 
              data={data.current} 
              period={data.period}
              users={users}
              rates={financialRates}
              onUpdateRate={updateFinancialRate}
            />
          ) : activeTab === "REMIX" ? (
            <FinancialAnalysis 
              data={data.current} 
              period={data.period}
              users={users}
              rates={financialRates}
              onUpdateRate={updateFinancialRate}
              isRemixMode={true}
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function GrowthCard({ title, qoq, yoy, color = "blue" }: any) {
  const colors: any = {
    blue: "text-blue-600 bg-blue-50 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-100 dark:bg-emerald-900/10 dark:border-emerald-900/30",
    indigo: "text-indigo-600 bg-indigo-50 border-indigo-100 dark:bg-indigo-900/10 dark:border-indigo-900/30"
  };

  const Badge = ({ value, label }: { value: number, label: string }) => {
    const isPositive = value > 0;
    const isZero = value === 0;
    return (
      <div className="flex flex-col">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-black">
            {isPositive ? "+" : ""}{value.toFixed(1)}%
          </span>
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</span>
      </div>
    );
  };

  return (
    <div className={`p-8 rounded-[32px] border ${colors[color]} space-y-6 transition-all hover:shadow-lg`}>
      <p className="text-xs font-black uppercase tracking-[0.2em] opacity-80">{title}</p>
      <div className="grid grid-cols-2 gap-8 border-t border-current/10 pt-6">
        <Badge value={qoq} label="vs Kỳ trước (QoQ)" />
        <Badge value={yoy} label="vs Cùng kỳ (YoY)" />
      </div>
    </div>
  );
}
