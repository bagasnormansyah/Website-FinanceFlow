import "server-only";

import { getCategories } from "@/lib/data/categories";
import { getAllTransactionsUntil } from "@/lib/data/transactions";
import {
  calculateCategoryTotals,
  getYearMonths,
  shiftMonth,
  summarizeTransactions,
} from "@/lib/finance";
import type { ReportData } from "@/lib/types";

export async function getReportData(userId: string, month: string): Promise<ReportData> {
  const year = Number(month.slice(0, 4));
  const [categories, transactions] = await Promise.all([
    getCategories(userId),
    getAllTransactionsUntil(userId, `${year}-12-31`),
  ]);

  const yearTransactions = transactions.filter(
    (item) => item.transaction_date <= `${year}-12-31`,
  );
  const monthTransactions = yearTransactions.filter((item) =>
    item.transaction_date.startsWith(month),
  );

  const summary = summarizeTransactions(transactions, categories, month);
  const previous = summarizeTransactions(transactions, categories, shiftMonth(month, -1));
  const yearly = summarizeTransactions(yearTransactions, categories);

  return {
    month,
    year,
    summary: { ...summary, balance: yearly.net },
    previous,
    categoryTotals: calculateCategoryTotals(monthTransactions, categories, "expense"),
    monthly: getYearMonths(year).map((item) =>
      summarizeTransactions(transactions, categories, item),
    ),
    yearly: {
      income: yearly.income,
      expense: yearly.expense,
      savings: yearly.savings,
      net: yearly.net,
    },
  };
}
