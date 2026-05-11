"use client";

import { FileSpreadsheet } from "lucide-react";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { format } from "date-fns";

interface ExportButtonProps {
  data: any;
  periodLabel: string;
  userRole?: string;
  financialRates: {
    userSalaries: Record<string, number>;
    standardMonthlyHours: number;
    revenueMode: "SRO_HOURS" | "PACKAGE";
    revenuePerSroHour: number;
    packageRevenue: number;
  };
}

export function ExportButton({ data, periodLabel, userRole, financialRates }: ExportButtonProps) {
  const exportToExcel = async () => {
    if (!data || !data.current) return;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PremiumService System';
    
    // Màu sắc chủ đạo
    const colors = {
      header: 'FF1E293B', // Slate 800
      accent: 'FF4F46E5', // Indigo 600
      emerald: 'FF059669', // Emerald 600
      rose: 'FFE11D48', // Rose 600
      gold: 'FFB45309', // Amber 700
      textWhite: 'FFFFFFFF'
    };

    const formatVND = (val: number) => {
      return new Intl.NumberFormat('vi-VN').format(val);
    };

    // --- SHEET 1: TỔNG QUAN (KPI) ---
    const summarySheet = workbook.addWorksheet('TỔNG QUAN KPI');
    summarySheet.columns = [{ width: 35 }, { width: 25 }, { width: 15 }, { width: 40 }];
    
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = `BÁO CÁO VẬN HÀNH PREMIUM SERVICE - ${periodLabel.toUpperCase()}`;
    titleCell.font = { size: 16, bold: true, color: { argb: colors.header } };
    titleCell.alignment = { horizontal: 'center' };

    summarySheet.addRow([]);
    summarySheet.addRow(['CHỈ SỐ KPI', 'GIÁ TRỊ', 'ĐƠN VỊ', 'DIỄN GIẢI']);
    summarySheet.getRow(3).eachCell(cell => {
      cell.font = { bold: true, color: { argb: colors.textWhite } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.accent } };
    });

    const efficiencyRatio = data.current.totalEstimatedHours > 0 ? (data.current.totalActualHours / data.current.totalEstimatedHours) * 100 : 0;
    
    summarySheet.addRows([
      ['Tỷ lệ Hiệu suất (Actual/Est)', efficiencyRatio.toFixed(1), '%', 'Độ chính xác của việc dự đoán giờ'],
      ['Tỷ lệ Đạt SLA', data.current.slaComplianceRate.toFixed(1), '%', 'Tỷ lệ hoàn thành đúng hạn'],
      ['Tỷ lệ Hoàn thành', data.current.completionRate.toFixed(1), '%', 'Tỷ lệ Ticket đã đóng / Tổng số'],
      ['Tổng số Ticket phát sinh', data.current.totalTickets, 'Ticket', 'Khối lượng yêu cầu trong kỳ'],
      ['Tổng giờ thực tế (ACT)', data.current.totalActualHours.toFixed(1), 'Giờ', 'Tổng thời gian bỏ ra thực tế'],
      ['Tổng giờ dự toán (EST)', data.current.totalEstimatedHours.toFixed(1), 'Giờ', 'Tổng định mức giờ cho các đầu việc'],
    ]);

    // --- SHEET 2: HỢP NHẤT CHIẾN LƯỢC (TÀI CHÍNH) ---
    if (userRole === "ADMIN" || userRole === "MANAGER" || userRole === "TAS") {
      const remixSheet = workbook.addWorksheet('CHIẾN LƯỢC TÀI CHÍNH');
      remixSheet.columns = [{ width: 35 }, { width: 25 }, { width: 25 }, { width: 20 }];

      remixSheet.mergeCells('A1:D1');
      remixSheet.getCell('A1').value = 'SO SÁNH PHƯƠNG ÁN TÀI CHÍNH (STRATEGIC REMIX)';
      remixSheet.getCell('A1').font = { bold: true, size: 14, color: { argb: colors.gold } };
      remixSheet.getCell('A1').alignment = { horizontal: 'center' };

      remixSheet.addRow([]);
      remixSheet.addRow(['Hạng mục', 'Phân bổ thực tế (ACCRUAL)', 'Dự phóng gói mới (PROJECTED)', 'Ghi chú']);
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
        ['Doanh thu (Revenue)', formatVND(accrualRev), formatVND(projectedRev), 'ACR: Theo gói thật | PRJ: Theo giá mới nhất'],
        ['Giá vốn nhân sự (Labor Cost)', formatVND(accrualCost), formatVND(projectedCost), 'Tính dựa trên lương và giờ làm thực tế'],
        ['Lợi nhuận gộp (Profit)', formatVND(accrualProfit), formatVND(projectedProfit), 'Doanh thu - Giá vốn'],
        ['Tỷ suất lợi nhuận (%)', accrualMargin.toFixed(1) + '%', projectedMargin.toFixed(1) + '%', 'Hiệu quả kinh doanh ròng'],
      ]);

      // Highlight results
      remixSheet.getCell('B6').font = { color: { argb: accrualProfit >= 0 ? colors.emerald : colors.rose }, bold: true };
      remixSheet.getCell('C6').font = { color: { argb: projectedProfit >= 0 ? colors.emerald : colors.rose }, bold: true };
    }

    // --- SHEET 3: DANH SÁCH TICKET CHI TIẾT ---
    const ticketSheet = workbook.addWorksheet('DANH SÁCH TICKET');
    ticketSheet.columns = [
      { header: 'MÃ SỐ', key: 'code', width: 15 },
      { header: 'TIÊU ĐỀ', key: 'title', width: 40 },
      { header: 'TRẠNG THÁI', key: 'status', width: 15 },
      { header: 'LOẠI', key: 'type', width: 12 },
      { header: 'MỨC ĐỘ', key: 'priority', width: 12 },
      { header: 'NGÀY PHÁT SINH', key: 'raiseDate', width: 20 },
      { header: 'NGÀY HẾT HẠN', key: 'deadline', width: 20 },
      { header: 'NGƯỜI XỬ LÝ', key: 'assignee', width: 20 },
      { header: 'GIỜ (EST)', key: 'est', width: 10 },
      { header: 'GIỜ (ACT)', key: 'act', width: 10 },
    ];

    ticketSheet.getRow(1).eachCell(cell => {
      cell.font = { bold: true, color: { argb: colors.textWhite } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: colors.emerald } };
    });

    // We need to pass tickets in the data result.
    // Assuming getTASOperationalReports returns tickets in data.current.tickets
    if (data.current.tickets) {
      data.current.tickets.forEach((t: any) => {
        ticketSheet.addRow({
          code: t.code,
          title: t.title,
          status: t.status,
          type: t.type,
          priority: t.priority,
          raiseDate: t.raiseDate ? format(new Date(t.raiseDate), "dd/MM/yyyy") : '-',
          deadline: t.deadline ? format(new Date(t.deadline), "dd/MM/yyyy") : '-',
          assignee: t.assignee?.name || 'Chưa gán',
          est: t.totalEst || 0,
          act: t.totalAct || 0
        });
      });
    }

    // --- SHEET 4: CHI TIẾT SRO & HIỆU SUẤT ---
    const sroSheet = workbook.addWorksheet('HIỆU SUẤT NHÂN SỰ & SRO');
    sroSheet.columns = [
      { header: 'NHÂN SỰ', key: 'name', width: 25 },
      { header: 'VAI TRÒ', key: 'role', width: 15 },
      { header: 'TICKET', key: 'tickets', width: 10 },
      { header: 'GIỜ DỰ TOÁN (EST)', key: 'estimate', width: 20 },
      { header: 'GIỜ THỰC TẾ (ACT)', key: 'actual', width: 20 },
      { header: 'HIỆU SUẤT (%)', key: 'efficiency', width: 15 },
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

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const dateStr = format(new Date(), "yyyyMMdd_HHmm");
    const clientName = data.client?.name || "ALL_CLIENTS";
    saveAs(new Blob([buffer]), `BAO_CAO_PREMIUM_${clientName}_${dateStr}.xlsx`);
  };

  return (
    <button
      onClick={exportToExcel}
      disabled={!data}
      className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white disabled:opacity-30 rounded-xl text-[10px] font-black transition-all border border-emerald-100 dark:border-emerald-800/50 uppercase tracking-widest active:scale-95 whitespace-nowrap shadow-sm"
    >
      <FileSpreadsheet className="w-4 h-4" />
      <span>XUẤT EXCEL (FULL DATA)</span>
    </button>
  );
}
