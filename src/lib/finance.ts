import type {
  Budget,
  BudgetItem,
  BudgetSummary,
  Category,
  CategoryTotal,
  ChartPoint,
  MonthlySummary,
  Transaction,
} from "@/lib/types";
import { formatMonthLabel, formatShortMonth } from "@/lib/format";

export function getMonthBounds(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function shiftMonth(monthKey: string, delta: number) {
  const [year, month] = monthKey.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return date.toISOString().slice(0, 7);
}

export function getMonthRange(endMonth: string, count: number) {
  return Array.from({ length: count }, (_, index) =>
    shiftMonth(endMonth, index - count + 1),
  );
}

export function getYearMonths(year: number) {
  return Array.from({ length: 12 }, (_, index) =>
    `${year}-${String(index + 1).padStart(2, "0")}`,
  );
}

function savingsIds(categories: Pick<Category, "id" | "is_savings">[]) {
  return new Set(categories.filter((item) => item.is_savings).map((item) => item.id));
}

export function summarizeTransactions(
  transactions: Transaction[],
  categories: Pick<Category, "id" | "is_savings">[],
  monthKey?: string,
): MonthlySummary {
  const savingsSet = savingsIds(categories);
  const scoped = monthKey
    ? transactions.filter((item) => item.transaction_date.startsWith(monthKey))
    : transactions;

  let income = 0;
  let expense = 0;
  let savings = 0;

  for (const item of scoped) {
    const amount = Number(item.amount);
    if (item.type === "income") {
      income += amount;
    } else if (savingsSet.has(item.category_id ?? "") || item.categories?.is_savings) {
      savings += amount;
    } else {
      expense += amount;
    }
  }

  return {
    month: monthKey ?? "all",
    income,
    expense,
    savings,
    net: income - expense - savings,
    balance: income - expense - savings,
    transactionCount: scoped.length,
  };
}

export function calculateChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function calculateCategoryTotals(
  transactions: Transaction[],
  categories: Pick<Category, "id" | "name" | "color" | "icon">[],
  type: "income" | "expense",
): CategoryTotal[] {
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const totals = new Map<string, number>();

  for (const item of transactions) {
    if (item.type !== type) continue;
    const key = item.category_id ?? "uncategorized";
    totals.set(key, (totals.get(key) ?? 0) + Number(item.amount));
  }

  const grandTotal = Array.from(totals.values()).reduce((sum, value) => sum + value, 0);

  return Array.from(totals.entries())
    .map(([id, amount]) => {
      const category = categoryMap.get(id);
      return {
        categoryId: id === "uncategorized" ? null : id,
        name: category?.name ?? "Tanpa Kategori",
        color: category?.color ?? "#94a3b8",
        icon: category?.icon ?? "circle",
        amount,
        percentage: grandTotal === 0 ? 0 : (amount / grandTotal) * 100,
      };
    })
    .sort((a, b) => b.amount - a.amount);
}

export function calculateBudgetSummary(
  budgets: Budget[],
  monthTransactions: Transaction[],
  categories: Pick<Category, "id" | "name" | "color">[],
): BudgetSummary {
  const categoryMap = new Map(categories.map((item) => [item.id, item]));
  const spentByCategory = new Map<string, number>();
  let totalExpense = 0;

  for (const item of monthTransactions) {
    if (item.type !== "expense") continue;
    const amount = Number(item.amount);
    totalExpense += amount;
    if (item.category_id) {
      spentByCategory.set(
        item.category_id,
        (spentByCategory.get(item.category_id) ?? 0) + amount,
      );
    }
  }

  const categoryBudgets = budgets.filter((budget) => budget.category_id);
  const overallBudget = budgets.find((budget) => !budget.category_id);

  const items: BudgetItem[] = (
    categoryBudgets.length > 0
      ? categoryBudgets
      : overallBudget
        ? [overallBudget]
        : []
  ).map((budget) => {
    const used = budget.category_id
      ? (spentByCategory.get(budget.category_id) ?? 0)
      : totalExpense;
    const amount = Number(budget.amount);
    return {
      id: budget.id,
      categoryId: budget.category_id ?? null,
      categoryName: budget.category_id
        ? (categoryMap.get(budget.category_id)?.name ?? "Tanpa Kategori")
        : "Semua Pengeluaran",
      color: budget.category_id
        ? (categoryMap.get(budget.category_id)?.color ?? "#3b82f6")
        : "#3b82f6",
      budget: amount,
      used,
      remaining: amount - used,
      percentage: amount === 0 ? 0 : (used / amount) * 100,
    };
  });

  const total = items.reduce((sum, item) => sum + item.budget, 0);
  const used = items.reduce((sum, item) => sum + item.used, 0);

  return {
    total,
    used,
    remaining: total - used,
    percentage: total === 0 ? 0 : (used / total) * 100,
    items: items.sort((a, b) => b.percentage - a.percentage),
  };
}

export function buildChartPoints(
  months: string[],
  transactions: Transaction[],
  categories: Pick<Category, "id" | "is_savings">[],
  openingBalance = 0,
): ChartPoint[] {
  let balance = openingBalance;

  return months.map((month) => {
    const summary = summarizeTransactions(transactions, categories, month);
    balance += summary.net;
    return {
      month,
      monthLabel: formatShortMonth(month),
      label: formatMonthLabel(month),
      income: summary.income,
      expense: summary.expense,
      savings: summary.savings,
      net: summary.net,
      balance,
      target: summary.income * 0.2,
    };
  });
}

export function getOpeningBalance(
  transactions: Transaction[],
  categories: Pick<Category, "id" | "is_savings">[],
  beforeMonth: string,
) {
  return summarizeTransactions(
    transactions.filter((item) => item.transaction_date < `${beforeMonth}-01`),
    categories,
  ).net;
}
