import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { format } from 'date-fns';

export async function exportAnalyticsToExcel(data: any, filters: any) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'PremiumService System';
  workbook.lastModifiedBy = 'Admin';
  workbook.created = new Date();

  // 1. OVERVIEW SHEET
  const summarySheet = workbook.addWorksheet('OVERVIEW');
  
  // Header style
  const headerStyle = {
    font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } } as ExcelJS.Fill,
    alignment: { horizontal: 'center' } as ExcelJS.Alignment
  };

  summarySheet.mergeCells('A1:D1');
  summarySheet.getCell('A1').value = 'SYSTEM OVERVIEW REPORT';
  summarySheet.getCell('A1').font = { size: 16, bold: true };
  summarySheet.getCell('A1').alignment = { horizontal: 'center' };

  summarySheet.addRow(['Report Period:', `${format(filters.startDate, 'dd/MM/yyyy')} - ${format(filters.endDate, 'dd/MM/yyyy')}`]);
  summarySheet.addRow(['Client:', filters.clientId === 'all' ? 'All Clients' : 'Specific Client']);
  summarySheet.addRow([]);

  // KPI data table
  summarySheet.addRow(['KPI INDICATOR', 'VALUE']);
  summarySheet.getRow(5).font = { bold: true };
  summarySheet.addRows([
    ['Total Tickets', data.totalTickets],
    ['Completion Rate', `${data.completionRate.toFixed(1)}%`],
    ['SLA Compliance', `${data.slaComplianceRate.toFixed(1)}%`],
    ['Total Estimated Hours (Est)', data.totalEstimatedHours],
    ['Total Actual Hours (Act)', data.totalActualHours],
  ]);

  // 2. PERSONNEL PERFORMANCE SHEET
  const perfSheet = workbook.addWorksheet('PERSONNEL PERFORMANCE');
  perfSheet.columns = [
    { header: 'PERSONNEL', key: 'name', width: 25 },
    { header: 'ROLE', key: 'role', width: 15 },
    { header: 'TICKETS', key: 'tickets', width: 12 },
    { header: 'ESTIMATED (H)', key: 'estimate', width: 15 },
    { header: 'ACTUAL (H)', key: 'actual', width: 15 },
    { header: 'EFFICIENCY (%)', key: 'efficiency', width: 15 },
    { header: 'EVALUATION', key: 'status', width: 25 },
  ];

  // Apply style for Performance sheet header
  perfSheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF059669' } };
  });

  data.sroPerformance.forEach((item: any) => {
    const status = item.efficiency >= 100 ? 'Faster than expected' : 
                   item.efficiency >= 85 ? 'Meets expectation' : 'Over budget';
    
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

  // 3. PORTFOLIO OPTIMIZATION SHEET
  const optSheet = workbook.addWorksheet('PORTFOLIO OPTIMIZATION');
  optSheet.columns = [
    { header: 'SRO ITEM', key: 'name', width: 40 },
    { header: 'CLIENT', key: 'client', width: 20 },
    { header: 'USAGE COUNT', key: 'count', width: 15 },
    { header: 'ESTIMATE/USE (H)', key: 'estimate', width: 15 },
    { header: 'TOTAL ACTUAL HOURS', key: 'hours', width: 15 },
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

  // Export file
  const buffer = await workbook.xlsx.writeBuffer();
  const fileName = `PremiumService_Report_${format(new Date(), 'ddMMyyyy_HHmm')}.xlsx`;
  saveAs(new Blob([buffer]), fileName);
}
