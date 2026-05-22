import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculatePriorityMatrix(urgency: string, impact: string): string | null {
  if (!urgency || !impact) return null;
  
  const matrix: Record<string, Record<string, string>> = {
    IMMEDIATE: {
      WIDESPREAD: "P1", LARGE: "P1", LIMITED: "P2", LOCALISED: "P3"
    },
    URGENT: {
      WIDESPREAD: "P1", LARGE: "P2", LIMITED: "P2", LOCALISED: "P3"
    },
    MODERATE: {
      WIDESPREAD: "P2", LARGE: "P2", LIMITED: "P3", LOCALISED: "P4"
    },
    STANDARD: {
      WIDESPREAD: "P3", LARGE: "P3", LIMITED: "P4", LOCALISED: "P4"
    }
  };
  
  return matrix[urgency]?.[impact] || null;
}
