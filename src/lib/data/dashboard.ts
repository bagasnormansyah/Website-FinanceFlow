import "server-only";

import { getBudgets } from "@/lib/data/budgets";
import { getCategories } from "@/lib/data/categories";
import { getAllTransactionsUntil, getRecentTransactions } from "@/lib/data/transactions";
import {
  buildChartPoints,
  calculateBudgetSummary,
  calculateCategoryTotals,
  calculateChange,
  getMonthBounds,
  getMonthRange,
  getOpeningBalance,
  shiftMonth,
  summarizeTransactions,
} from "@/lib/finance";
import type { DashboardData } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export async function getDashboardData(
  userId: string,
  month: string,
): Promise<DashboardData> {
  const supabase = await createClient();
  const [{ data: profile }, categories, budgets, recentTransactions] = await Promise.all([
    supabase.from("profiles").select("currency").eq("id", userId).maybeSingle(),
    getCategories(userId),
    getBudgets(userId, month),
    getRecentTransactions(userId, 5),
  ]);

  const { end } = getMonthBounds(month);
  const transactions = await getAllTransactionsUntil(userId, end);

  const current = summarizeTransactions(transactions, categories, month);
  const previous = summarizeTransactions(transactions, categories, shiftMonth(month, -1));
  const allTime = summarizeTransactions(transactions, categories);
  const monthTransactions = transactions.filter((item) =>
    item.transaction_date.startsWith(month),
  );

  const months = getMonthRange(month, 12);
  const openingBalance = getOpeningBalance(transactions, categories, months[0]);
  const points = buildChartPoints(months, transactions, categories, openingBalance);

  return {
    month,
    currency: profile?.currency ?? "IDR",
    overview: {
      balance: allTime.net,
      income: current.income,
      expense: current.expense,
      savings: current.savings,
      incomeChange: calculateChange(current.income, previous.income),
      expenseChange: calculateChange(current.expense, previous.expense),
      savingsChange: calculateChange(current.savings, previous.savings),
    },
    charts: {
      incomeVsExpense: points,
      cashFlow: points,
      expenseByCategory: calculateCategoryTotals(monthTransactions, categories, "expense"),
      trends: points,
      savingsProgress: points,
    },
    recentTransactions,
    budget: calculateBudgetSummary(budgets, monthTransactions, categories),
  };
}
