import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Wallet } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { FinancialAnalytics } from "@/components/dashboard/analytics-charts";
import { BudgetOverview } from "@/components/dashboard/budget-overview";
import { RecentTransactions } from "@/components/dashboard/recent-transactions";
import { PageHeader } from "@/components/layout/page-header";
import { MonthNavigator } from "@/components/reports/month-navigator";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { requireUser } from "@/lib/auth/dal";
import { getCategories } from "@/lib/data/categories";
import { getDashboardData } from "@/lib/data/dashboard";
import { formatMonthLabel } from "@/lib/format";
import { readMonth } from "@/lib/page-params";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const month = readMonth(params.month);
  const user = await requireUser();

  const [data, categories] = await Promise.all([
    getDashboardData(user.id, month),
    getCategories(user.id),
  ]);

  const { overview } = data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Ringkasan keuangan Anda untuk ${formatMonthLabel(month)}. Semua angka dihitung langsung dari database.`}
        actions={
          <>
            <MonthNavigator month={month} basePath="/dashboard" />
            <TransactionDialog categories={categories} />
          </>
        }
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Total Saldo"
          value={overview.balance}
          currency={data.currency}
          icon={Wallet}
          hint="Akumulasi seluruh transaksi"
        />
        <StatCard
          title="Pemasukan Bulan Ini"
          value={overview.income}
          currency={data.currency}
          icon={ArrowDownLeft}
          change={overview.incomeChange}
          tone="income"
        />
        <StatCard
          title="Pengeluaran Bulan Ini"
          value={overview.expense}
          currency={data.currency}
          icon={ArrowUpRight}
          change={overview.expenseChange}
          tone="expense"
        />
        <StatCard
          title="Tabungan Bulan Ini"
          value={overview.savings}
          currency={data.currency}
          icon={PiggyBank}
          change={overview.savingsChange}
          tone="warning"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <BudgetOverview budget={data.budget} currency={data.currency} />
        </div>
        <RecentTransactions transactions={data.recentTransactions} currency={data.currency} />
      </div>

      <FinancialAnalytics charts={data.charts} currency={data.currency} month={month} />
    </div>
  );
}
