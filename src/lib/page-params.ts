import { currentMonthKey } from "@/lib/format";

export function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export function readMonth(value: string | string[] | undefined) {
  const month = firstParam(value);
  return month && /^\d{4}-\d{2}$/.test(month) ? month : currentMonthKey();
}

export function readString(
  value: string | string[] | undefined,
  fallback = "",
) {
  return firstParam(value) ?? fallback;
}

export function readPositiveInt(value: string | string[] | undefined, fallback = 1) {
  const parsed = Number.parseInt(firstParam(value) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
