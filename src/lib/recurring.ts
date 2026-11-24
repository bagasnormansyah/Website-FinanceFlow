import type { RecurringFrequency, RecurringRule } from "@/lib/types";

function parseISO(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return { year, month, day };
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function toISO(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function occurrenceAt(
  startDate: string,
  frequency: RecurringFrequency,
  index: number,
): string {
  const { year, month, day } = parseISO(startDate);

  if (frequency === "daily") {
    const date = new Date(Date.UTC(year, month - 1, day + index));
    return toISO(date);
  }

  if (frequency === "weekly") {
    const date = new Date(Date.UTC(year, month - 1, day + index * 7));
    return toISO(date);
  }

  if (frequency === "monthly") {
    const offset = month - 1 + index;
    const targetYear = year + Math.floor(offset / 12);
    const targetMonth = (offset % 12) + 1;
    const targetDay = Math.min(day, daysInMonth(targetYear, targetMonth));
    return toISO(new Date(Date.UTC(targetYear, targetMonth - 1, targetDay)));
  }

  const targetYear = year + index;
  const targetDay = Math.min(day, daysInMonth(targetYear, month));
  return toISO(new Date(Date.UTC(targetYear, month - 1, targetDay)));
}

export function addOneDay(date: string) {
  const { year, month, day } = parseISO(date);
  return toISO(new Date(Date.UTC(year, month - 1, day + 1)));
}

export function getDueOccurrences(
  rule: Pick<
    RecurringRule,
    "start_date" | "end_date" | "frequency" | "last_generated_date"
  >,
  today: string,
): string[] {
  const lowerBound = rule.last_generated_date
    ? addOneDay(rule.last_generated_date)
    : rule.start_date;
  const upperBound = rule.end_date && rule.end_date < today ? rule.end_date : today;
  if (upperBound < lowerBound) return [];

  const dates: string[] = [];
  for (let index = 0; index < 10000; index += 1) {
    const date = occurrenceAt(rule.start_date, rule.frequency, index);
    if (date > upperBound) break;
    if (date >= lowerBound) dates.push(date);
  }
  return dates;
}
