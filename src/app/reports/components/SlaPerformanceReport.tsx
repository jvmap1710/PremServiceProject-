"use client";

import { useState, useRef } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from "recharts";
import { Download, Info, BarChart2, Clock } from "lucide-react";
import toast from "react-hot-toast";

interface SlaLine {
  id: string;
  requestId: string;
  title: string;
  priority: string;
  ticketType: string;
  
  ackSlaTarget: number | null;
  actualAckTime: number | null;
  
  responseSlaTarget: number | null;
  actualResponseTime: number | null;
  
  completionSlaTarget: number | null;
  actualCompletionTime: number | null;
}

interface ServiceRequest {
  id: string;
  code: string;
  title: string;
  raiseDate: string;
  slaLines?: SlaLine[];
}

interface SlaPerformanceReportProps {
  data: {
    current: {
      tickets: ServiceRequest[];
    };
    period: {
      label: string;
    };
  };
}

export function SlaPerformanceReport({ data }: SlaPerformanceReportProps) {
  const [viewMode, setViewMode] = useState<"HOURS" | "PERCENTAGE">("HOURS");
  const chartRef = useRef<HTMLDivElement>(null);

  // Extract all tickets that have SLA lines
  const ticketsWithSla = (data?.current?.tickets || []).filter(
    (t) => t.slaLines && t.slaLines.length > 0
  );

  // Map each SLA line to a point in the chart data
  const chartData = ticketsWithSla.flatMap((ticket) => {
    return (ticket.slaLines || []).map((line, idx) => {
      const ackTarget = line.ackSlaTarget ?? 0;
      const ackActual = line.actualAckTime ?? 0;
      const respTarget = line.responseSlaTarget ?? 0;
      const respActual = line.actualResponseTime ?? 0;
      const restTarget = line.completionSlaTarget ?? 0;
      const restActual = line.actualCompletionTime ?? 0;

      // Calculate performance percentage (actual / target * 100)
      const ackPerf = ackTarget > 0 ? (ackActual / ackTarget) * 100 : 0;
      const respPerf = respTarget > 0 ? (respActual / respTarget) * 100 : 0;
      const restPerf = restTarget > 0 ? (restActual / restTarget) * 100 : 0;

      return {
        // Use request code and line index for unique label
        name: ticket.code + (ticket.slaLines!.length > 1 ? `-${idx + 1}` : ""),
        ticketCode: ticket.code,
        title: ticket.title,
        
        // Hours
        ackTarget: line.ackSlaTarget,
        ackActual: line.actualAckTime,
        responseTarget: line.responseSlaTarget,
        responseActual: line.actualResponseTime,
        restorationTarget: line.completionSlaTarget,
        restorationActual: line.actualCompletionTime,

        // Performance Percentages
        ackPerf: parseFloat(ackPerf.toFixed(1)),
        respPerf: parseFloat(respPerf.toFixed(1)),
        restPerf: parseFloat(restPerf.toFixed(1)),
      };
    });
  }).sort((a, b) => a.ticketCode.localeCompare(b.ticketCode)); // Sort chronologically/by ticket code

  // Aggregate global performance stats
  let totalAckTarget = 0;
  let totalAckActual = 0;
  let totalRespTarget = 0;
  let totalRespActual = 0;
  let totalRestTarget = 0;
  let totalRestActual = 0;

  ticketsWithSla.forEach((t) => {
    (t.slaLines || []).forEach((line) => {
      if (line.ackSlaTarget !== null && line.actualAckTime !== null) {
        totalAckTarget += line.ackSlaTarget;
        totalAckActual += line.actualAckTime;
      }
      if (line.responseSlaTarget !== null && line.actualResponseTime !== null) {
        totalRespTarget += line.responseSlaTarget;
        totalRespActual += line.actualResponseTime;
      }
      if (line.completionSlaTarget !== null && line.actualCompletionTime !== null) {
        totalRestTarget += line.completionSlaTarget;
        totalRestActual += line.actualCompletionTime;
      }
    });
  });

  const ackPerformance = totalAckTarget > 0 ? (totalAckActual / totalAckTarget) * 100 : 100;
  const responsePerformance = totalRespTarget > 0 ? (totalRespActual / totalRespTarget) * 100 : 100;
  const restorationPerformance = totalRestTarget > 0 ? (totalRestActual / totalRestTarget) * 100 : 100;

  const overallPerformance = (ackPerformance + responsePerformance + restorationPerformance) / 3;

  // Pure client-side high-resolution PNG export using HTML5 Canvas API
  const handleExportPng = () => {
    try {
      const container = chartRef.current;
      if (!container) return;
      const svgElement = container.querySelector("svg");
      if (!svgElement) {
        toast.error("Could not find chart to export");
        return;
      }

      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgElement);

      if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const svgUrl = URL.createObjectURL(svgBlob);
      const image = new Image();

      image.onload = () => {
        const canvas = document.createElement("canvas");
        const width = svgElement.clientWidth || 800;
        const height = svgElement.clientHeight || 450;
        
        // Export high DPI (2x multiplier)
        canvas.width = width * 2;
        canvas.height = height * 2;
        
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(2, 2);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(image, 0, 0, width, height);
          
          const pngUrl = canvas.toDataURL("image/png");
          const downloadLink = document.createElement("a");
          downloadLink.href = pngUrl;
          downloadLink.download = `SLA_Performance_Report_${viewMode}_${new Date().toISOString().split('T')[0]}.png`;
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
          toast.success("Chart exported as PNG successfully!");
        }
        URL.revokeObjectURL(svgUrl);
      };

      image.src = svgUrl;
    } catch (e) {
      console.error(e);
      toast.error("Failed to export chart image");
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Date Filter & Control Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tight">SLA Performance Dashboard</h3>
          <p className="text-xs text-slate-500 font-medium">Visualization of Acknowledgement, Response, and Service Restoration targets vs actuals</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Mode Toggle Buttons */}
          <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl border border-slate-300 dark:border-slate-700">
            <button
              onClick={() => setViewMode("HOURS")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === "HOURS"
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              Hours View
            </button>
            <button
              onClick={() => setViewMode("PERCENTAGE")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
                viewMode === "PERCENTAGE"
                  ? "bg-white dark:bg-slate-900 text-blue-600 shadow-sm"
                  : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              Performance %
            </button>
          </div>

          {/* Export Button */}
          <button
            onClick={handleExportPng}
            disabled={chartData.length === 0}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black px-4 py-2.5 rounded-xl uppercase tracking-wider shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
        </div>
      </div>

      {/* KPI Highlight Summary Box */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-[28px] text-white shadow-md relative overflow-hidden transition-all hover:scale-[1.02]">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
          <h5 className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Overall SLA Performance</h5>
          <span className="text-4xl font-black">{overallPerformance.toFixed(1)}%</span>
          <p className="text-[10px] mt-2 opacity-90 font-medium">Average across Ack, Response, & Restoration</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:scale-[1.02]">
          <div className="absolute right-4 top-4 text-rose-500/10"><Info className="w-8 h-8" /></div>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Acknowledgement Performance</h5>
          <span className="text-3xl font-black text-rose-600">{ackPerformance.toFixed(1)}%</span>
          <p className="text-[10px] mt-2 text-slate-500 font-medium">Used {ackPerformance.toFixed(1)}% of total SLA hours allocated</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:scale-[1.02]">
          <div className="absolute right-4 top-4 text-amber-500/10"><Info className="w-8 h-8" /></div>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Response Performance</h5>
          <span className="text-3xl font-black text-amber-500">{responsePerformance.toFixed(1)}%</span>
          <p className="text-[10px] mt-2 text-slate-500 font-medium">Used {responsePerformance.toFixed(1)}% of total SLA hours allocated</p>
        </div>

        <div className="bg-white dark:bg-slate-900 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 shadow-sm relative overflow-hidden transition-all hover:scale-[1.02]">
          <div className="absolute right-4 top-4 text-purple-500/10"><Info className="w-8 h-8" /></div>
          <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Restoration Performance</h5>
          <span className="text-3xl font-black text-purple-600">{restorationPerformance.toFixed(1)}%</span>
          <p className="text-[10px] mt-2 text-slate-500 font-medium">Used {restorationPerformance.toFixed(1)}% of total SLA hours allocated</p>
        </div>
      </div>

      {/* Main Chart Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">SLA Measurement Chart</h4>
            <p className="text-xs text-slate-500 font-medium">
              {viewMode === "HOURS" 
                ? "SLA Hours: Targets (dashed) vs. Actuals (solid) mapped per ticket" 
                : "SLA Efficiency: Time elapsed represented as percentage of target limits"
              }
            </p>
          </div>
          {chartData.length > 0 && (
            <span className="text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 px-3 py-1.5 rounded-full uppercase font-black tracking-wider">
              {chartData.length} Data Points
            </span>
          )}
        </div>

        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-slate-50 dark:bg-slate-800/10 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Info className="w-8 h-8 text-slate-300 mb-2" />
            <p className="text-sm text-slate-400 font-black uppercase tracking-widest">No SLA Data Found</p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">No tickets in this period contain configured SLA Lines. Please check another date range or client.</p>
          </div>
        ) : (
          <div ref={chartRef} id="sla-performance-chart-container" className="h-[450px] w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }}
                  dy={10}
                />
                
                {/* Dual Y-Axes */}
                <YAxis 
                  yAxisId="left" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#475569', fontSize: 11, fontWeight: 700 }}
                  label={{ value: 'Hours', angle: -90, position: 'insideLeft', offset: -10, fill: '#475569', fontSize: 11, fontWeight: 700 }}
                />
                <YAxis 
                  yAxisId="right" 
                  orientation="right"
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#2563eb', fontSize: 11, fontWeight: 700 }}
                  domain={[0, 100]}
                  label={{ value: 'Performance (%)', angle: 90, position: 'insideRight', offset: -10, fill: '#2563eb', fontSize: 11, fontWeight: 700 }}
                />

                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    backgroundColor: '#ffffff'
                  }}
                  itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                  labelStyle={{ fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}
                />
                
                <Legend 
                  verticalAlign="bottom" 
                  align="center" 
                  iconType="circle" 
                  iconSize={8}
                  wrapperStyle={{ paddingTop: '20px', fontSize: '11px', fontWeight: 700 }} 
                />

                {viewMode === "HOURS" ? (
                  // === HOURS VIEW: 6 Lines (Target dashed, Actual solid) ===
                  [
                    { key: "ackTarget", name: "Ack Target (Hours)", stroke: "#fca5a5", dash: "4 4" },
                    { key: "ackActual", name: "Ack Actual (Hours)", stroke: "#dc2626", dash: "0" },
                    
                    { key: "responseTarget", name: "Response Target (Hours)", stroke: "#fdba74", dash: "4 4" },
                    { key: "responseActual", name: "Response Actual (Hours)", stroke: "#d97706", dash: "0" },
                    
                    { key: "restorationTarget", name: "Restoration Target (Hours)", stroke: "#c084fc", dash: "4 4" },
                    { key: "restorationActual", name: "Restoration Actual (Hours)", stroke: "#6d28d9", dash: "0" }
                  ].map((lineConfig) => (
                    <Line
                      key={lineConfig.key}
                      yAxisId="left"
                      type="monotone"
                      dataKey={lineConfig.key}
                      name={lineConfig.name}
                      stroke={lineConfig.stroke}
                      strokeWidth={lineConfig.dash === "0" ? 3 : 2}
                      strokeDasharray={lineConfig.dash}
                      dot={lineConfig.dash === "0" ? { r: 4, fill: lineConfig.stroke, strokeWidth: 2, stroke: '#fff' } : false}
                      activeDot={lineConfig.dash === "0" ? { r: 6 } : false}
                    />
                  ))
                ) : (
                  // === PERCENTAGE VIEW: 3 Lines mapped to Right Axis ===
                  [
                    { key: "ackPerf", name: "Ack Performance (%)", stroke: "#dc2626" },
                    { key: "respPerf", name: "Response Performance (%)", stroke: "#d97706" },
                    { key: "restPerf", name: "Restoration Performance (%)", stroke: "#6d28d9" }
                  ].map((lineConfig) => (
                    <Line
                      key={lineConfig.key}
                      yAxisId="right"
                      type="monotone"
                      dataKey={lineConfig.key}
                      name={lineConfig.name}
                      stroke={lineConfig.stroke}
                      strokeWidth={3}
                      dot={{ r: 4, fill: lineConfig.stroke, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 6 }}
                    />
                  ))
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* SLA Performance Calculation Details Card */}
      <div className="bg-slate-50 dark:bg-slate-800/20 p-6 rounded-[28px] border border-slate-100 dark:border-slate-800 text-xs flex gap-3 text-slate-500 font-medium">
        <Info className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-slate-700 dark:text-slate-300">About SLA Performance Calculation Formula:</p>
          <p>
            - <strong>Individual Metrics:</strong> Calculated as `(sum of Actual Hours / sum of Target Hours) * 100`. 
            Since a lower actual value compared to target means a faster solution, an SLA Performance ratio <strong>below 100%</strong> represents outstanding speed.
          </p>
          <p>
            - <strong>Overall SLA Performance:</strong> Defined as the direct mathematical average: `(Acknowledgement + Response + Restoration) / 3`.
          </p>
        </div>
      </div>
    </div>
  );
}
