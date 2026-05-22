"use client";

import { FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";

interface ExportButtonProps {
  data: any;
  periodLabel: string;
  userRole?: string;
  users?: any[];
  financialRates: {
    userSalaries: Record<string, number>;
    standardMonthlyHours: number;
    revenueMode: "SRO_HOURS" | "PACKAGE";
    revenuePerSroHour: number;
    packageRevenue: number;
  };
}

export function ExportButton({ data, periodLabel, userRole, users = [], financialRates }: ExportButtonProps) {
  const exportToExcel = async () => {
    if (!data || !data.current) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PremiumService System';
    
    // Main colors
    const colors = {
      header: 'FF1E293B', // Slate 800
      accent: 'FF4F46E5', // Indigo 600
      emerald: 'FF059669', // Emerald 600
      rose: 'FFE11D48', // Rose 600
      gold: 'FFB45309', // Amber 700
      textWhite: 'FFFFFFFF'
    };

    const formatVND = (val: number) => {
      return new Intl.NumberFormat('en-US').format(val);
    };

    // --- SHEET 1: OVERVIEW (KPI) ---
    const summarySheet = workbook.addWorksheet('KPI OVERVIEW');
    summarySheet.columns = [{ width: 35 }, { width: 25 }, { width: 15 }, { width: 40 }];
    
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `PREMIUM SERVICE OPERATION REPORT - ${periodLabel.toUpperCase()}`;
    titleCell.font = { size: 16, bold: true, color: { argb: colors.header } };
    titleCell.alignment = { horizontal: 'center' };

    summarySheet.addRow([]);
    summarySheet.addRow(['KPI INDICATOR', 'VALUE', 'UNIT', 'DESCRIPTION']);
    summarySheet.getRow(3).eachCell(cell => {
      cell.font = { bold: true, color: { argb: colors.textWhite } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent } };
    });

    const efficiencyRatio = data.current.totalEstimatedHours > 0 ? (data.current.totalActualHours / data.current.totalEstimatedHours) * 100 : 0;
    
    summarySheet.addRows([
      ['Efficiency Ratio (Actual/Est)', efficiencyRatio.toFixed(1), '%', 'Accuracy of hour estimation'],
      ['SLA Compliance Rate', data.current.slaComplianceRate.toFixed(1), '%', 'On-time completion rate'],
      ['Completion Rate', data.current.completionRate.toFixed(1), '%', 'Closed Tickets / Total'],
      ['Total Ticket Volume', data.current.totalTickets, 'Ticket', 'Total requests in period'],
      ['Total Actual Hours (ACT)', data.current.totalActualHours.toFixed(1), 'Hours', 'Actual time spent'],
      ['Total Estimated Hours (EST)', data.current.totalEstimatedHours.toFixed(1), 'Hours', 'Total estimated quota'],
    ]);

    // --- SHEET 2: STRATEGIC CONSOLIDATION (FINANCIAL) ---
    if (userRole === "ADMIN" || userRole === "MANAGER" || userRole === "TAS") {
      const remixSheet = workbook.addWorksheet('FINANCIAL STRATEGY');
      remixSheet.columns = [{ width: 35 }, { width: 25 }, { width: 25 }, { width: 20 }];

      remixSheet.mergeCells('A1:D1');
      remixSheet.getCell('A1').value = 'FINANCIAL STRATEGY COMPARISON (STRATEGIC REMIX)';
      remixSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: colors.gold } };
      remixSheet.getCell('A1').alignment = { horizontal: 'center' };

      remixSheet.addRow([]);
      remixSheet.addRow(['Category', 'Actual Allocation (ACCRUAL)', 'New Package Projection (PROJECTED)', 'Notes']);
      remixSheet.getRow(3).eachCell(cell => {
        cell.font = { bold: true, color: { argb: colors.textWhite } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.header } };
      });

      // Calc logic
      const calcCosts = (perfData: any) => {
        return perfData.sroPerformance.reduce((sum: number, p: any) => {
          const salary = financialRates.userSalaries[p.userId] || 0;
          const hourlyRate = salary / (financialRates.standardMonthlyHours || 176);
          return sum + (p.actual * hourlyRate);
        }, 0);
      };

      const accrualCost = calcCosts(data.current);
      const projectedCost = calcCosts(data.projected);

      const accrualRev = data.current.totalPackageRevenue;
      const projectedRev = data.projected.totalPackageRevenue;

      const accrualProfit = accrualRev - accrualCost;
      const projectedProfit = projectedRev - projectedCost;

      const accrualMargin = accrualRev > 0 ? (accrualProfit / accrualRev) * 100 : 0;
      const projectedMargin = projectedRev > 0 ? (projectedProfit / projectedRev) * 100 : 0;

      remixSheet.addRows([
        ['Revenue', formatVND(accrualRev), formatVND(projectedRev), 'ACR: Real pkg | PRJ: Latest price'],
        ['Labor Cost', formatVND(accrualCost), formatVND(projectedCost), 'Based on salary and actual hours'],
        ['Gross Profit', formatVND(accrualProfit), formatVND(projectedProfit), 'Revenue - Labor Cost'],
        ['Profit Margin (%)', accrualMargin.toFixed(1) + '%', projectedMargin.toFixed(1) + '%', 'Net business efficiency'],
      ]);

      // Highlight results
      remixSheet.getCell('B6').font = { color: { argb: accrualProfit >= 0 ? colors.emerald : colors.rose }, bold: true };
      remixSheet.getCell('C6').font = { color: { argb: projectedProfit >= 0 ? colors.emerald : colors.rose }, bold: true };
    }

    // --- SHEET 3: DETAILED TICKET LIST ---
    const ticketSheet = workbook.addWorksheet('TICKET LIST');
    ticketSheet.columns = [
      { header: 'CODE', key: 'code', width: 15 },
      { header: 'TITLE', key: 'title', width: 40 },
      { header: 'STATUS', key: 'status', width: 15 },
      { header: 'TYPE', key: 'type', width: 12 },
      { header: 'PRIORITY', key: 'priority', width: 12 },
      { header: 'CREATED DATE', key: 'raiseDate', width: 20 },
      { header: 'DEADLINE', key: 'deadline', width: 20 },
      { header: 'ASSIGNEE', key: 'assignee', width: 20 },
      { header: 'EST HOURS', key: 'est', width: 10 },
      { header: 'ACT HOURS', key: 'act', width: 10 },
    ];

    ticketSheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: colors.textWhite } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emerald } };
    });

    // We need to pass tickets in the data result.
    // Assuming getTASOperationalReports returns tickets in data.current.tickets
    if (data.current.tickets) {
      data.current.tickets.forEach((t: any) => {
        const ids = (t.assigneeIds || "").split(",").map((id: string) => id.trim()).filter(Boolean);
        let assigneeNames = 'Unassigned';
        if (ids.length > 0) {
          assigneeNames = ids.map((id: string) => {
            const found = users?.find((u: any) => u.id === id);
            if (found) return found.name;
            if (t.assignee && t.assignee.id === id) return t.assignee.name;
            return id;
          }).join(", ");
        } else if (t.assignee?.name) {
          assigneeNames = t.assignee.name;
        }

        ticketSheet.addRow({
          code: t.code,
          title: t.title,
          status: t.status,
          type: t.type,
          priority: t.priority,
          raiseDate: t.raiseDate ? format(new Date(t.raiseDate), "dd/MM/yyyy") : '-',
          deadline: t.deadline ? format(new Date(t.deadline), "dd/MM/yyyy") : '-',
          assignee: assigneeNames,
          est: t.totalEst || 0,
          act: t.totalAct || 0
        });
      });
    }

    // --- SHEET 4: SRO DETAILS & PERFORMANCE ---
    const sroSheet = workbook.addWorksheet('SRO & PERSONNEL PERFORMANCE');
    sroSheet.columns = [
      { header: 'PERSONNEL', key: 'name', width: 25 },
      { header: 'ROLE', key: 'role', width: 15 },
      { header: 'TICKETS', key: 'tickets', width: 10 },
      { header: 'ESTIMATED HOURS', key: 'estimate', width: 20 },
      { header: 'ACTUAL HOURS', key: 'actual', width: 20 },
      { header: 'EFFICIENCY (%)', key: 'efficiency', width: 15 },
    ];

    sroSheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: colors.textWhite } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.gold } };
    });

    data.current.sroPerformance.forEach((item: any) => {
      sroSheet.addRow({
        name: item.name,
        role: item.role,
        tickets: item.tickets,
        estimate: item.estimate.toFixed(2),
        actual: item.actual.toFixed(2),
        efficiency: item.efficiency.toFixed(2)
      });
    });

    // Export file
    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = format(new Date(), "yyyyMMdd_HHmm");
    const clientName = data.client?.name || "ALL_CLIENTS";
    saveAs(new Blob([buffer]), `PREMIUM_REPORT_${clientName}_${dateStr}.xlsx`);
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={!data}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-30 rounded-xl text-[10px] font-black transition-all border border-emerald-100 dark:border-emerald-800/50 uppercase tracking-widest active:scale-95 whitespace-nowrap shadow-sm"
    >
      <FileSpreadsheet className="w-4 h-4" />
      <span>EXPORT EXCEL (FULL DATA)</span>
    </button>
  );
}
