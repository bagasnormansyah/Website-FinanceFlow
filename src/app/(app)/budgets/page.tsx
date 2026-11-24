import type { Metadata } from "next";
import { AlertTriangle, CheckCircle2, Target } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BudgetDialog } from "@/components/budgets/budget-dialog";
import { BudgetList } from "@/components/budgets/budget-list";
import { PageHeader } from "@/components/layout/page-header";
import { MonthNavigator } from "@/components/reports/month-navigator";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { getBudgets } from "@/lib/data/budgets";
import { getCategories } from "@/lib/data/categories";
import { getAllTransactionsUntil } from "@/lib/data/transactions";
import { formatCurrency, formatMonthLabel, percent } from "@/lib/format";
import { calculateBudgetSummary, getMonthBounds } from "@/lib/finance";
import { readMonth } from "@/lib/page-params";

export const metadata: Metadata = { title: "Anggaran" };

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const month = readMonth(params.month);
  const user = await requireUser();

  const [budgets, categories, profile] = await Promise.all([
    getBudgets(user.id, month),
    getCategories(user.id),
    getProfile(),
  ]);
  const currency = profile?.currency ?? "IDR";
  const { end } = getMonthBounds(month);
  const transactions = await getAllTransactionsUntil(user.id, end);
  const monthTransactions = transactions.filter((item) => item.transaction_date.startsWith(month));
  const summary = calculateBudgetSummary(budgets, monthTransactions, categories);
  const expenseCategories = categories.filter((item) => item.type === "expense");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Anggaran"
        description={`Atur batas pengeluaran bulanan dan pantau penggunaannya untuk ${formatMonthLabel(month)}.`}
        actions={
          <>
            <MonthNavigator month={month} basePath="/budgets" />
            <BudgetDialog categories={expenseCategories} defaultMonth={month} />
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Anggaran</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(summary.total, currency)}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Terpakai</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-rose-500">
            {formatCurrency(summary.used, currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Tersisa</CardTitle>
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-500">
            {formatCurrency(summary.remaining, currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              {summary.percentage > 100 ? (
                <AlertTriangle className="size-4 text-rose-500" />
              ) : (
                <Target className="size-4 text-blue-500" />
              )}
              Penggunaan
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`text-2xl font-semibold ${summary.percentage > 100 ? "text-rose-500" : summary.percentage >= 80 ? "text-amber-500" : ""}`}
          >
            {percent(summary.percentage)}
          </CardContent>
        </Card>
      </section>

      {summary.percentage > 100 ? (
        <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-500">
          <AlertTriangle className="size-4" />
          Anggaran bulan ini sudah terlampaui. Pertimbangkan untuk menyesuaikan nominal atau mengurangi pengeluaran.
        </div>
      ) : summary.percentage >= 80 ? (
        <div className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-500">
          <AlertTriangle className="size-4" />
          Penggunaan anggaran sudah mendekati batas.
        </div>
      ) : null}

      {summary.total > 0 && summary.percentage < 80 ? (
        <div className="flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-500">
          <CheckCircle2 className="size-4" />
          Penggunaan anggaran masih dalam batas aman.
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Detail Anggaran</CardTitle>
          <CardDescription>Rekap anggaran per kategori dan realisasi pengeluarannya.</CardDescription>
        </CardHeader>
        <CardContent>
          <BudgetList items={summary.items} categories={categories} month={month} currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}
