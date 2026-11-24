import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { MonthNavigator } from "@/components/reports/month-navigator";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { getCategories } from "@/lib/data/categories";
import { getAllTransactionsUntil } from "@/lib/data/transactions";
import { formatCurrency, formatMonthLabel } from "@/lib/format";
import { getMonthBounds } from "@/lib/finance";
import { readMonth } from "@/lib/page-params";

export const metadata: Metadata = { title: "Pengeluaran" };

export default async function ExpensePage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const month = readMonth(params.month);
  const user = await requireUser();

  const [categories, profile] = await Promise.all([getCategories(user.id), getProfile()]);
  const currency = profile?.currency ?? "IDR";
  const { end } = getMonthBounds(month);
  const allTransactions = await getAllTransactionsUntil(user.id, end);
  const transactions = allTransactions.filter(
    (item) => item.type === "expense" && item.transaction_date.startsWith(month),
  );
  const total = transactions.reduce((sum, item) => sum + Number(item.amount), 0);
  const average = transactions.length > 0 ? total / transactions.length : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengeluaran"
        description={`Pantau pengeluaran Anda pada ${formatMonthLabel(month)}. Kategori tabungan tidak termasuk pengeluaran.`}
        actions={
          <>
            <MonthNavigator month={month} basePath="/expense" />
            <TransactionDialog categories={categories} fixedType="expense" />
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Pengeluaran</CardTitle>
            <ArrowUpRight className="size-4 text-rose-500" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-rose-500">
            {formatCurrency(total, currency)}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Jumlah Transaksi</CardTitle>
            <CalendarDays className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{transactions.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Rata-rata per Transaksi</CardTitle>
            <Coins className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{formatCurrency(average, currency)}</CardContent>
        </Card>
      </section>

      <TransactionTable transactions={transactions} categories={categories} currency={currency} />
    </div>
  );
}
