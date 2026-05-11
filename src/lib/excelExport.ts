import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export async function exportAnalyticsToExcel(data: any, filters: any) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PremiumService System';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();

  // 1. SHEET TỔNG QUAN
  const summarySheet = workbook.addWorksheet('TỔNG QUAN');
  
  // Style cho header
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } } as ExcelJS.Fill,
    alignment: { horizontal: 'center' } as ExcelJS.Alignment
  };

  summarySheet.mergeCells('A1:D1');
  summarySheet.getCell('A1').value = 'BÁO CÁO TỔNG QUAN HỆ THỐNG';
  summarySheet.getCell('A1').font = { size: 16, bold: true };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  summarySheet.addRow(['Thời gian báo cáo:', `${format(filters.startDate, 'dd/MM/yyyy')} - ${format(filters.endDate, 'dd/MM/yyyy')}`]);
  summarySheet.addRow(['Khách hàng:', filters.clientId === 'all' ? 'Tất cả khách hàng' : 'Khách hàng cụ thể']);
  summarySheet.addRow([]);

  // Bảng số liệu KPI
  summarySheet.addRow(['CHỈ SỐ KPI', 'GIÁ TRỊ']);
  summarySheet.getRow(5).font = { bold: true };
  summarySheet.addRows([
    ['Tổng số Ticket', data.totalTickets],
    ['Tỷ lệ hoàn thành', `${data.completionRate.toFixed(1)}%`],
    ['Tỷ lệ đúng hạn (SLA)', `${data.slaComplianceRate.toFixed(1)}%`],
    ['Tổng giờ dự toán (Est)', data.totalEstimatedHours],
    ['Tổng giờ thực tế (Act)', data.totalActualHours],
  ]);

  // 2. SHEET HIỆU SUẤT NHÂN SỰ
  const perfSheet = workbook.addWorksheet('HIỆU SUẤT NHÂN SỰ');
  perfSheet.columns = [
    { header: 'NHÂN SỰ', key: 'name', width: 25 },
    { header: 'VAI TRÒ', key: 'role', width: 15 },
    { header: 'SỐ TICKET', key: 'tickets', width: 12 },
    { header: 'DỰ TOÁN (H)', key: 'estimate', width: 15 },
    { header: 'THỰC TẾ (H)', key: 'actual', width: 15 },
    { header: 'HIỆU SUẤT (%)', key: 'efficiency', width: 15 },
    { header: 'ĐÁNH GIÁ', key: 'status', width: 25 },
  ];

  // Áp dụng style cho header của sheet Hiệu suất
  perfSheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  });

  data.sroPerformance.forEach((item: any) => {
    const status = item.efficiency >= 100 ? 'Nhanh hơn dự kiến' : 
                   item.efficiency >= 85 ? 'Đạt yêu cầu' : 'Lố dự toán';
    
    perfSheet.addRow({
      name: item.name,
      role: item.role,
      tickets: item.tickets,
      estimate: item.estimate.toFixed(1),
      actual: item.actual.toFixed(1),
      efficiency: item.efficiency.toFixed(1),
      status: status
    });
  });

  // 3. SHEET TỐI ƯU DANH MỤC
  const optSheet = workbook.addWorksheet('TỐI ƯU DANH MỤC');
  optSheet.columns = [
    { header: 'HẠNG MỤC (SRO)', key: 'name', width: 40 },
    { header: 'KHÁCH HÀNG', key: 'client', width: 20 },
    { header: 'SỐ LẦN SỬ DỤNG', key: 'count', width: 15 },
    { header: 'DỰ TOÁN/LẦN (H)', key: 'estimate', width: 15 },
    { header: 'TỔNG GIỜ THỰC TẾ', key: 'hours', width: 15 },
  ];

  optSheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF7C3AED' } };
  });

  data.sroUsageAnalysis.forEach((item: any) => {
    optSheet.addRow({
      name: item.name,
      client: item.client,
      count: item.count,
      estimate: item.estimate,
      hours: item.hours.toFixed(1)
    });
  });

  // Xuất file
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `Bao_cao_PremiumService_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
}
