import type { Metadata } from "next";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, PiggyBank, Scale } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/dashboard/stat-card";
import { PageHeader } from "@/components/layout/page-header";
import { MonthNavigator } from "@/components/reports/month-navigator";
import { ReportCharts } from "@/components/reports/report-charts";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { getReportData } from "@/lib/data/reports";
import { formatCurrency, formatMonthLabel, formatNumber } from "@/lib/format";
import { calculateChange } from "@/lib/finance";
import { readMonth } from "@/lib/page-params";

export const metadata: Metadata = { title: "Laporan" };

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const params = await searchParams;
  const month = readMonth(params.month);
  const user = await requireUser();

  const [report, profile] = await Promise.all([getReportData(user.id, month), getProfile()]);
  const currency = profile?.currency ?? "IDR";
  const { summary, previous, yearly, monthly } = report;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Laporan Keuangan"
        description={`Analisis pemasukan, pengeluaran, tabungan, dan perbandingan antar bulan per ${report.year}.`}
        actions={<MonthNavigator month={month} basePath="/reports" />}
      />

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title={`Pemasukan ${formatMonthLabel(month)}`}
          value={summary.income}
          currency={currency}
          icon={ArrowDownLeft}
          change={calculateChange(summary.income, previous.income)}
          tone="income"
        />
        <StatCard
          title="Pengeluaran"
          value={summary.expense}
          currency={currency}
          icon={ArrowUpRight}
          change={calculateChange(summary.expense, previous.expense)}
          tone="expense"
        />
        <StatCard
          title="Tabungan"
          value={summary.savings}
          currency={currency}
          icon={PiggyBank}
          change={calculateChange(summary.savings, previous.savings)}
          tone="warning"
        />
        <StatCard
          title="Saldo Tahun Berjalan"
          value={yearly.net}
          currency={currency}
          icon={Scale}
          hint={`total ${formatMonthLabel(month)}: ${formatCurrency(summary.net, currency)}`}
        />
      </section>

      <ReportCharts report={report} currency={currency} />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Riwayat Laporan Bulanan</CardTitle>
            <CardDescription>Klik bulan untuk membuka laporan detail.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Bulan</TableHead>
                    <TableHead className="text-right">Pemasukan</TableHead>
                    <TableHead className="text-right">Pengeluaran</TableHead>
                    <TableHead className="text-right">Tabungan</TableHead>
                    <TableHead className="text-right">Saldo</TableHead>
                    <TableHead className="text-right">Transaksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthly.map((item) => (
                    <TableRow
                      key={item.month}
                      className={item.month === month ? "bg-primary/5 font-medium" : ""}
                    >
                      <TableCell>
                        <Link href={`/reports?month=${item.month}`} className="hover:underline">
                          {formatMonthLabel(item.month)}
                        </Link>
                      </TableCell>
                      <TableCell className="text-right text-emerald-500">
                        {formatCurrency(item.income, currency)}
                      </TableCell>
                      <TableCell className="text-right text-rose-500">
                        {formatCurrency(item.expense, currency)}
                      </TableCell>
                      <TableCell className="text-right text-amber-500">
                        {formatCurrency(item.savings, currency)}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(item.net, currency)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatNumber(item.transactionCount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rekap Tahunan {report.year}</CardTitle>
            <CardDescription>Akumulasi seluruh transaksi tahun berjalan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between border-b pb-3 text-sm">
              <span className="text-muted-foreground">Total Pemasukan</span>
              <span className="font-semibold text-emerald-500">{formatCurrency(yearly.income, currency)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3 text-sm">
              <span className="text-muted-foreground">Total Pengeluaran</span>
              <span className="font-semibold text-rose-500">{formatCurrency(yearly.expense, currency)}</span>
            </div>
            <div className="flex items-center justify-between border-b pb-3 text-sm">
              <span className="text-muted-foreground">Total Tabungan</span>
              <span className="font-semibold text-amber-500">{formatCurrency(yearly.savings, currency)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Saldo Tahunan</span>
              <span className="text-lg font-semibold text-blue-500">{formatCurrency(yearly.net, currency)}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
