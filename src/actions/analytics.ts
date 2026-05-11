"use server";

import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear, subMonths, subQuarters, subYears, format, addMonths, startOfDay, endOfDay, differenceInMonths } from "date-fns";
import { syncPackageStatuses } from "./package";

export type PeriodType = "MONTH" | "QUARTER" | "YEAR" | "CUSTOM";

export interface PerformanceItem {
  userId: string;
  name: string;
  role: string;
  ticketsAssigned: number;
  ticketsCreated: number;
  estimate: number;
  actual: number;
  efficiency: number;
  rating: number;
}

export interface StatResults {
  totalTickets: number;
  doneTickets: number;
  totalActualHours: number;
  totalEstimatedHours: number;
  typeDistribution: { name: string, value: number }[];
  sroPerformance: PerformanceItem[];
  slaComplianceRate: number;
  trendData: { month: string, tickets: number, hours: number }[];
  totalPackageRevenue: number;
  sroUsageAnalysis: any[]; // Still a bit complex
  completionRate: number;
  totalMonthlyQuota: number;
  packages: any[];
  latestPriceMap: Record<string, number>;
  tickets: any[];
}

export async function getTASOperationalReports(
  clientId: string | "all", 
  fiscalYearStart: number,
  fiscalYearEnd: number,
  periodValueStart: number, 
  periodValueEnd: number,
  periodType: PeriodType,
  customStart?: Date,
  customEnd?: Date
) {
  let currentStart: Date;
  let currentEnd: Date;
  let prevStart: Date;
  let prevEnd: Date;
  let yoyStart: Date;
  let yoyEnd: Date;

  // FY_START_MONTH = 3 means April (0-indexed)
  // This is the core logic for the company's fiscal year
  const FY_START_MONTH = 3; 

  if (periodType === "CUSTOM" && customStart && customEnd) {
    // 1. CUSTOM RANGE: User picks specific dates. We use startOfDay/endOfDay for accuracy.
    currentStart = startOfDay(customStart);
    currentEnd = endOfDay(customEnd);
    
    // Previous period for comparison is the same duration immediately before
    const durationMs = currentEnd.getTime() - currentStart.getTime();
    prevStart = new Date(currentStart.getTime() - durationMs - 1);
    prevEnd = new Date(currentStart.getTime() - 1);
    
    // YoY is exactly 1 year ago
    yoyStart = subYears(currentStart, 1);
    yoyEnd = subYears(currentEnd, 1);
  } else if (periodType === "MONTH") {
    // 2. MONTH RANGE: Strictly calendar months as requested by user.
    // Selecting "Feb 2026" means exactly Feb 2026.
    currentStart = startOfMonth(new Date(fiscalYearStart, periodValueStart - 1, 1));
    currentEnd = endOfMonth(new Date(fiscalYearEnd, periodValueEnd - 1, 1));
    
    const durationMs = currentEnd.getTime() - currentStart.getTime();
    prevStart = new Date(currentStart.getTime() - durationMs - 1);
    prevEnd = new Date(currentStart.getTime() - 1);
    
    yoyStart = subYears(currentStart, 1);
    yoyEnd = subYears(currentEnd, 1);
  } else if (periodType === "QUARTER") {
    // 3. QUARTER RANGE: Maps to Fiscal Quarters (Q1 = Apr-Jun).
    const getQuarterDates = (q: number, fy: number) => {
      // Logic: Q1 starts at month 3 (April) of the fiscal year
      const startM = (FY_START_MONTH + (q - 1) * 3) % 12;
      const startY = fy + Math.floor((FY_START_MONTH + (q - 1) * 3) / 12);
      const start = startOfMonth(new Date(startY, startM, 1));
      const end = endOfMonth(addMonths(start, 2));
      return { start, end };
    };

    const qStart = getQuarterDates(periodValueStart, fiscalYearStart);
    const qEnd = getQuarterDates(periodValueEnd, fiscalYearEnd);
    
    currentStart = qStart.start;
    currentEnd = qEnd.end;

    const durationMs = currentEnd.getTime() - currentStart.getTime();
    prevStart = new Date(currentStart.getTime() - durationMs - 1);
    prevEnd = new Date(currentStart.getTime() - 1);

    yoyStart = subYears(currentStart, 1);
    yoyEnd = subYears(currentEnd, 1);
  } else {
    // Full Fiscal Year(s) range
    currentStart = startOfMonth(new Date(fiscalYearStart, FY_START_MONTH, 1));
    currentEnd = endOfMonth(new Date(fiscalYearEnd + 1, FY_START_MONTH - 1, 1));

    const durationMs = currentEnd.getTime() - currentStart.getTime();
    prevStart = new Date(currentStart.getTime() - durationMs - 1);
    prevEnd = new Date(currentStart.getTime() - 1);

    yoyStart = subYears(currentStart, 1);
    yoyEnd = subYears(currentEnd, 1);
  }

  const clientFilter = clientId === "all" ? {} : { clientId };

  // Đảm bảo trạng thái các gói được cập nhật trước khi lấy báo cáo
  await syncPackageStatuses(clientId === "all" ? undefined : clientId);

  const [currentData, prevData, yoyData] = await Promise.all([
    fetchStats(clientFilter, currentStart, currentEnd, clientId),
    fetchStats(clientFilter, prevStart, prevEnd, clientId),
    fetchStats(clientFilter, yoyStart, yoyEnd, clientId),
  ]);

  // --- CALCULATE PROJECTED DATA (REMIX) ---
  // Projected logic: 
  // 1. No "now" capping (Projected is for the full period)
  // 2. Use latestPriceMap for ALL months in the period
  const durationMonths = Math.max(1, (currentEnd.getFullYear() - currentStart.getFullYear()) * 12 + (currentEnd.getMonth() - currentStart.getMonth()) + 1);
  
  let projectedRevenue = 0;
  // sum up latestPriceMap for each client active in currentData.packages
  const activeClientIds = Array.from(new Set(currentData.packages.map((p: any) => p.clientId)));
  activeClientIds.forEach(cid => {
    const latestMonthly = (currentData.latestPriceMap[cid] || 0) / 12;
    projectedRevenue += latestMonthly * durationMonths;
  });

  const projectedData = {
    ...currentData,
    totalPackageRevenue: projectedRevenue
  };

  return {
    current: currentData,
    projected: projectedData,
    comparison: {
      qoq: calculateChange(currentData, prevData),
      yoy: calculateChange(currentData, yoyData),
    },
    period: {
      start: currentStart,
      end: currentEnd,
      label: formatFiscalPeriod(currentStart, currentEnd, periodType, periodValueStart, periodValueEnd, fiscalYearStart, fiscalYearEnd)
    }
  };
}

async function fetchStats(filter: any, start: Date, end: Date, clientId: string) {
  // Direct Prisma query with clear inclusions
  // We calculate everything in one pass for performance
  const requests = await prisma.serviceRequest.findMany({
    where: {
      ...filter,
      raiseDate: {
        gte: start,
        lte: end,
      },
    },
    include: {
      assignee: { select: { id: true, name: true, role: true } },
      creator: { select: { id: true, name: true, role: true } },
      workLogs: {
        include: { user: true }
      },
      items: {
        include: { sroRule: true }
      }
    },
  });

  // Calculate total package revenue for the period
  // We assume monthlyPrice applies to each month covered in the report
  const packages = await prisma.premiumPackage.findMany({
    where: {
      ...(clientId === "all" ? {} : { clientId }),
      validFrom: { lte: end },
      validTo: { gte: start }
    }
  });

  // Fetch ABSOLUTE latest package for each client found in the period
  const clientIds = Array.from(new Set(packages.map(p => p.clientId)));
  const latestPackages = await prisma.premiumPackage.findMany({
    where: {
      clientId: { in: clientIds }
    },
    orderBy: { validFrom: 'desc' }
  });

  const latestPriceMap: Record<string, number> = {};
  latestPackages.forEach(lp => {
    if (!latestPriceMap[lp.clientId]) {
      latestPriceMap[lp.clientId] = lp.monthlyPrice || 0;
    }
  });

  const now = new Date();
  const totalPackageRevenue = packages.reduce((sum, pkg) => {
    // Tính số tháng mà gói này active TRONG khoảng thời gian report [start, end]
    const pkgStart = pkg.validFrom > start ? pkg.validFrom : start;
    
    // Thực tế (Accrual) chỉ tính đến ngày hôm nay (now) hoặc ngày kết thúc report, tùy cái nào đến trước
    const effectiveEnd = end < now ? end : now;
    const pkgEnd = pkg.validTo < effectiveEnd ? pkg.validTo : effectiveEnd;
    
    if (pkgStart > pkgEnd) return sum; // Không overlap hoặc gói chưa bắt đầu tính đến nay

    // Số tháng overlap (tối thiểu 1 nếu có overlap)
    const overlapMonths = Math.max(1, (pkgEnd.getFullYear() - pkgStart.getFullYear()) * 12 + (pkgEnd.getMonth() - pkgStart.getMonth()) + 1);
    
    // Treat pkg.monthlyPrice as Annual Price
    const monthlyRate = (pkg.monthlyPrice || 0) / 12;
    return sum + (monthlyRate * overlapMonths);
  }, 0);

  const totalMonthlyQuota = packages.reduce((sum, pkg) => {
    // Tương tự tính doanh thu, tính định mức giờ
    const pkgStart = pkg.validFrom > start ? pkg.validFrom : start;
    const pkgEnd = pkg.validTo < end ? pkg.validTo : end;
    if (pkgStart > pkgEnd) return sum;
    const overlapMonths = Math.max(1, (pkgEnd.getFullYear() - pkgStart.getFullYear()) * 12 + (pkgEnd.getMonth() - pkgStart.getMonth()) + 1);
    return sum + (pkg.monthlyQuota * overlapMonths);
  }, 0);

  const totalTickets = requests.length;
  const doneTickets = requests.filter(r => r.status === "DONE").length;
  const totalActualHours = requests.reduce((sum, r) => sum + r.workLogs.reduce((s, l) => s + l.hours, 0), 0);
  const totalEstimatedHours = requests.reduce((sum, r) => sum + r.items.reduce((sum, i) => sum + (i.sroRule.estimateHours * (i.quantity || 1)), 0), 0);

  const typeDistribution = [
    { name: "TASK", value: requests.filter(r => r.type === "TASK").length },
    { name: "BUG", value: requests.filter(r => r.type === "BUG").length },
    { name: "FEATURE", value: requests.filter(r => r.type === "FEATURE").length },
    { name: "URGENT", value: requests.filter(r => r.type === "URGENT").length },
  ];

  const allRelevantUsers = await prisma.user.findMany({
    where: { role: { in: ["TAS", "IMP_ENGINEER", "ADMIN"] } },
    select: { id: true, name: true, role: true } // Exclude salary and email from general analytics
  });

  const performanceMap: Record<string, any> = {};
  allRelevantUsers.forEach(u => {
    performanceMap[u.id] = {
      userId: u.id,
      name: u.name,
      role: u.role,
      ticketsAssigned: 0,
      ticketsCreated: 0,
      estimate: 0,
      actual: 0
    };
  });

  // Aggregate stats from requests
  requests.forEach(req => {
    // 1. Ghi nhận công lao Tạo Ticket (Dành cho TAS/Admin)
    if (req.createdById && performanceMap[req.createdById]) {
      performanceMap[req.createdById].ticketsCreated += 1;
    }
    
    // 2. Ghi nhận công lao Xử lý Ticket (Dành cho Assignee - thường là Engineer)
    if (req.assigneeId && performanceMap[req.assigneeId]) {
      performanceMap[req.assigneeId].ticketsAssigned += 1;
      // Chỉ tính estimate vào người được giao xử lý chính
      performanceMap[req.assigneeId].estimate += req.items.reduce((sum, i) => sum + (i.sroRule.estimateHours * (i.quantity || 1)), 0);
    }

    // 3. Ghi nhận thời gian thực tế (Dành cho bất kỳ ai tham gia log giờ)
    req.workLogs.forEach(log => {
      if (log.userId && performanceMap[log.userId]) {
        performanceMap[log.userId].actual += log.hours;
      }
    });
  });

  const sroPerformance = Object.values(performanceMap)
    .filter((item: any) => item.ticketsCreated > 0 || item.ticketsAssigned > 0 || item.actual > 0)
    .map((item: any) => {
      // Hiệu suất chỉ tính nếu có cả dự toán và thực tế (tránh TAS bị 0% oan nếu không làm)
      const efficiency = item.actual > 0 ? (item.estimate / item.actual) * 100 : 0;
      
      let rating = 3;
      if (item.actual === 0 && item.estimate === 0) rating = 0; // Không đánh giá nếu không trực tiếp làm
      else if (efficiency >= 110) rating = 5;
      else if (efficiency >= 90) rating = 4;
      else if (efficiency >= 70) rating = 3;
      else if (efficiency >= 40) rating = 2;
      else rating = 1;

      return { ...item, efficiency, rating };
    }).sort((a: any, b: any) => (b.ticketsCreated + b.ticketsAssigned) - (a.ticketsCreated + a.ticketsAssigned));

  const slaTickets = requests.filter(r => r.status === "DONE" && r.deadline);
  const compliantTickets = slaTickets.filter(r => {
    const lastWorkLog = r.workLogs.sort((a, b) => b.logDate.getTime() - a.logDate.getTime())[0];
    return lastWorkLog && lastWorkLog.logDate <= r.deadline!;
  });
  const slaComplianceRate = slaTickets.length > 0 ? (compliantTickets.length / slaTickets.length) * 100 : 100;

  // Trend Data: Group by month
  const trendMap: Record<string, { month: string, tickets: number, hours: number }> = {};
  requests.forEach(r => {
    const monthKey = format(r.raiseDate, "MM/yyyy");
    if (!trendMap[monthKey]) trendMap[monthKey] = { month: monthKey, tickets: 0, hours: 0 };
    trendMap[monthKey].tickets += 1;
    trendMap[monthKey].hours += r.workLogs.reduce((sum, l) => sum + l.hours, 0);
  });
  const trendData = Object.values(trendMap).sort((a, b) => {
    const [ma, ya] = a.month.split("/").map(Number);
    const [mb, yb] = b.month.split("/").map(Number);
    return ya !== yb ? ya - yb : ma - mb;
  });

  return {
    totalTickets,
    doneTickets,
    totalActualHours,
    totalEstimatedHours,
    typeDistribution,
    sroPerformance,
    slaComplianceRate,
    trendData,
    totalPackageRevenue,
    sroUsageAnalysis: await getSROUsageAnalysis(requests, clientId),
    completionRate: totalTickets > 0 ? (doneTickets / totalTickets) * 100 : 0,
    totalMonthlyQuota,
    packages, // Trả về danh sách gói để hỗ trợ tính Remix
    latestPriceMap, // Trả về giá mới nhất tuyệt đối theo khách hàng
    tickets: requests, // Trả về danh sách ticket chi tiết cho export
  };
}

async function getSROUsageAnalysis(requests: any[], clientId: string) {
  // Fetch all rules available for the context
  const rules = await prisma.sRORule.findMany({
    where: clientId !== "all" ? { package: { clientId } } : {},
    include: { package: { include: { client: true } } }
  });

  const usageMap = rules.reduce((acc: any, rule) => {
    acc[rule.id] = {
      id: rule.id,
      name: rule.taskName,
      client: rule.package.client.name,
      count: 0,
      hours: 0,
      estimate: rule.estimateHours
    };
    return acc;
  }, {});

  requests.forEach(req => {
    req.items.forEach((item: any) => {
      if (usageMap[item.sroRuleId]) {
        usageMap[item.sroRuleId].count += (item.quantity || 1);
        usageMap[item.sroRuleId].hours += req.workLogs.reduce((sum: number, l: any) => sum + l.hours, 0);
      }
    });
  });

  return Object.values(usageMap).sort((a: any, b: any) => b.count - a.count);
}

function calculateChange(current: any, previous: any) {
  const calc = (cur: number, prev: number) => {
    if (prev === 0) return cur > 0 ? 100 : 0;
    return ((cur - prev) / prev) * 100;
  };

  return {
    ticketsChange: calc(current.totalTickets, previous.totalTickets),
    hoursChange: calc(current.totalActualHours, previous.totalActualHours),
  };
}

function formatFiscalPeriod(start: Date, end: Date, type: PeriodType, vStart: number, vEnd: number, fyStart: number, fyEnd: number) {
  if (type === "MONTH") {
    if (vStart === vEnd && fyStart === fyEnd) return `Tháng ${format(start, "MM/yyyy")}`;
    return `Tháng ${format(start, "MM/yyyy")} - Tháng ${format(end, "MM/yyyy")}`;
  }
  if (type === "QUARTER") {
    if (vStart === vEnd && fyStart === fyEnd) return `Quý ${vStart} / ${fyStart} (${format(start, "MM/yy")} - ${format(end, "MM/yy")})`;
    return `Quý ${vStart} / ${fyStart} - Quý ${vEnd} / ${fyEnd} (${format(start, "MM/yy")} - ${format(end, "MM/yy")})`;
  }
  if (type === "CUSTOM") return `Từ ${format(start, "dd/MM/yy")} đến ${format(end, "dd/MM/yy")}`;
  if (fyStart === fyEnd) return `Năm ${fyStart} (04/${fyStart} - 03/${fyStart + 1})`;
  return `Năm ${fyStart} - ${fyEnd} (04/${fyStart} - 03/${fyEnd + 1})`;
}

export async function getFinancialSettings() {
  const session = await auth();
  if (!session || (session.user?.role !== "ADMIN" && session.user?.role !== "MANAGER")) {
    throw new Error("Unauthorized: Only Admins or Managers can view financial settings.");
  }

  const [settings, users] = await Promise.all([
    prisma.globalSettings.findUnique({ where: { id: "system" } }),
    prisma.user.findMany({ 
      where: { role: { in: ["TAS", "ADMIN", "IMP_ENGINEER"] } },
      select: { id: true, name: true, salary: true } 
    })
  ]);

  const userSalaries: Record<string, number> = {};
  users.forEach(u => {
    userSalaries[u.id] = u.salary || 0;
  });

  return {
    standardMonthlyHours: settings?.standardMonthlyHours || 176,
    revenueMode: (settings?.revenueMode as "PACKAGE" | "SRO_HOURS") || "PACKAGE",
    revenuePerSroHour: settings?.revenuePerSroHour || 0,
    userSalaries
  };
}

export async function updateFinancialSettings(data: { 
  standardMonthlyHours?: number, 
  revenueMode?: string, 
  revenuePerSroHour?: number,
  userSalaries?: Record<string, number>
}) {
  const session = await auth();
  if (!session || session.user?.role !== "ADMIN") {
    throw new Error("Unauthorized: Only Admins can modify financial settings.");
  }

  // Validation: No negative values
  if (data.standardMonthlyHours !== undefined && data.standardMonthlyHours < 1) {
    throw new Error("Giờ định mức phải lớn hơn 0");
  }
  if (data.revenuePerSroHour !== undefined && data.revenuePerSroHour < 0) {
    throw new Error("Đơn giá SRO không được âm");
  }

  if (data.standardMonthlyHours !== undefined || data.revenueMode !== undefined || data.revenuePerSroHour !== undefined) {
    await prisma.globalSettings.upsert({
      where: { id: "system" },
      update: {
        standardMonthlyHours: data.standardMonthlyHours,
        revenueMode: data.revenueMode,
        revenuePerSroHour: data.revenuePerSroHour
      },
      create: {
        id: "system",
        standardMonthlyHours: data.standardMonthlyHours || 176,
        revenueMode: data.revenueMode || "PACKAGE",
        revenuePerSroHour: data.revenuePerSroHour || 0
      }
    });
  }

  if (data.userSalaries) {
    for (const [userId, salary] of Object.entries(data.userSalaries)) {
      if (salary < 0) continue; // Skip negative salaries
      await prisma.user.update({
        where: { id: userId },
        data: { salary }
      });
    }
  }
  revalidatePath("/reports");
  return { success: true };
}
