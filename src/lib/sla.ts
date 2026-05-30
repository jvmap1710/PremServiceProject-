import { prisma } from "./prisma";

interface WorkingHoursConfig {
  workStartTime: string; // "HH:mm"
  workEndTime: string;   // "HH:mm"
  workDays: number[];    // [1,2,3,4,5] = Mon-Fri
}

/**
 * Parse "HH:mm" string to total minutes from midnight
 */
function parseTimeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

/**
 * Get the working hours configuration from GlobalSettings.
 * Caches per request to avoid repeated DB calls.
 */
let cachedConfig: WorkingHoursConfig | null = null;
let cachedHolidays: Set<string> | null = null;

export async function getWorkingHoursConfig(): Promise<WorkingHoursConfig> {
  if (cachedConfig) return cachedConfig;

  const settings = await prisma.globalSettings.findFirst({
    where: { id: "system" },
  });

  cachedConfig = {
    workStartTime: settings?.workStartTime || "08:30",
    workEndTime: settings?.workEndTime || "18:00",
    workDays: (settings?.workDays || "1,2,3,4,5").split(",").map(Number),
  };

  return cachedConfig;
}

/**
 * Get set of holiday date strings (YYYY-MM-DD format) between two dates.
 */
async function getHolidaySet(start: Date, end: Date): Promise<Set<string>> {
  const holidays = await prisma.holiday.findMany({
    where: {
      date: {
        gte: new Date(start.getFullYear(), start.getMonth(), start.getDate()),
        lte: new Date(end.getFullYear(), end.getMonth(), end.getDate() + 1),
      },
    },
  });

  return new Set(
    holidays.map((h) => {
      const d = new Date(h.date);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    })
  );
}

/**
 * Calculate working hours between two DateTimes.
 * 
 * Respects:
 * - Configurable working hours (e.g., 08:30-18:00)
 * - Configurable working days (e.g., Mon-Fri)
 * - Holiday calendar (skips holidays)
 * 
 * Algorithm:
 * - Iterate day by day from start to end
 * - For each day, check if it's a working day and not a holiday
 * - Calculate the overlap between [start, end] and [workStart, workEnd] for that day
 * - Sum all valid working minutes, convert to hours
 * 
 * @returns Float rounded to 2 decimal places
 */
export async function calculateWorkingHours(
  start: Date,
  end: Date
): Promise<number> {
  if (!start || !end || end <= start) return 0;

  const config = await getWorkingHoursConfig();
  const holidaySet = await getHolidaySet(start, end);

  const workStartMin = parseTimeToMinutes(config.workStartTime);
  const workEndMin = parseTimeToMinutes(config.workEndTime);
  const dailyWorkMinutes = workEndMin - workStartMin;

  if (dailyWorkMinutes <= 0) return 0;

  let totalMinutes = 0;

  // Iterate day by day
  const currentDate = new Date(start);
  currentDate.setHours(0, 0, 0, 0);

  const endDateMidnight = new Date(end);
  endDateMidnight.setHours(0, 0, 0, 0);

  while (currentDate <= endDateMidnight) {
    const dayOfWeek = currentDate.getDay(); // 0=Sun, 1=Mon...6=Sat
    const dateKey = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-${String(currentDate.getDate()).padStart(2, "0")}`;

    // Skip non-working days
    if (!config.workDays.includes(dayOfWeek)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // Skip holidays
    if (holidaySet.has(dateKey)) {
      currentDate.setDate(currentDate.getDate() + 1);
      continue;
    }

    // This is a valid working day. Calculate overlap with working window.
    const dayStart = new Date(currentDate);
    const dayEnd = new Date(currentDate);

    // Set working window boundaries for this day
    dayStart.setHours(Math.floor(workStartMin / 60), workStartMin % 60, 0, 0);
    dayEnd.setHours(Math.floor(workEndMin / 60), workEndMin % 60, 0, 0);

    // Clamp to actual start/end
    const effectiveStart = start > dayStart ? start : dayStart;
    const effectiveEnd = end < dayEnd ? end : dayEnd;

    if (effectiveStart < effectiveEnd) {
      const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
      totalMinutes += diffMs / (1000 * 60);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Convert minutes to hours, round to 2 decimal places
  const hours = Math.round((totalMinutes / 60) * 100) / 100;
  return hours;
}

/**
 * Reset the cached configuration (call after admin updates settings).
 */
export function resetSlaConfigCache(): void {
  cachedConfig = null;
  cachedHolidays = null;
}
