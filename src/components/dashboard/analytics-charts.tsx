"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCompactCurrency, formatCurrency, formatMonthLabel } from "@/lib/format";
import type { DashboardData } from "@/lib/types";

const axisStyle = { fontSize: 11, fill: "currentColor", opacity: 0.6 };

export function FinancialAnalytics({
  charts,
  currency,
  month,
}: {
  charts: DashboardData["charts"];
  currency: string;
  month: string;
}) {
  const [period, setPeriod] = useState("6");

  const points = useMemo(() => {
    const count = Number(period);
    return {
      incomeVsExpense: charts.incomeVsExpense.slice(-count),
      cashFlow: charts.cashFlow.slice(-count),
      trends: charts.trends.slice(-count),
      savingsProgress: charts.savingsProgress.slice(-count),
    };
  }, [charts, period]);

  const tooltip = <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Analisis Keuangan</h2>
          <p className="text-sm text-muted-foreground">
            Periode berakhir {formatMonthLabel(month)}. Pilih rentang untuk melihat tren.
          </p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">3 bulan terakhir</SelectItem>
            <SelectItem value="6">6 bulan terakhir</SelectItem>
            <SelectItem value="12">12 bulan terakhir</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pemasukan vs Pengeluaran</CardTitle>
            <CardDescription>Perbandingan arus kas per bulan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points.incomeVsExpense} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border" />
                <XAxis dataKey="monthLabel" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
                  width={64}
                />
                {tooltip}
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arus Kas Bulanan</CardTitle>
            <CardDescription>Selisih pemasukan dan pengeluaran setiap bulan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={points.cashFlow} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="cashFlowFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border" />
                <XAxis dataKey="monthLabel" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
                  width={64}
                />
                {tooltip}
                <ReferenceLine y={0} stroke="currentColor" opacity={0.3} />
                <Area
                  type="monotone"
                  dataKey="net"
                  name="Arus Kas"
                  stroke="#3b82f6"
                  fill="url(#cashFlowFill)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribusi Pengeluaran</CardTitle>
            <CardDescription>Kategori dengan pengeluaran terbesar bulan ini.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            {charts.expenseByCategory.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                Belum ada pengeluaran pada bulan ini.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.expenseByCategory}
                    dataKey="amount"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {charts.expenseByCategory.map((item) => (
                      <Cell key={item.categoryId ?? "none"} fill={item.color} />
                    ))}
                  </Pie>
                  {tooltip}
                  <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tren Keuangan</CardTitle>
            <CardDescription>Saldo kumulatif dan total tabungan.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={points.trends} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border" />
                <XAxis dataKey="monthLabel" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
                  width={64}
                />
                {tooltip}
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="balance" name="Saldo" stroke="#3b82f6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="savings" name="Tabungan" stroke="#eab308" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Progres Tabungan</CardTitle>
            <CardDescription>
              Tabungan dibanding target 20% dari pemasukan bulanan.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={points.savingsProgress} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border" />
                <XAxis dataKey="monthLabel" tick={axisStyle} axisLine={false} tickLine={false} />
                <YAxis
                  tick={axisStyle}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
                  width={64}
                />
                {tooltip}
                <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="savings" name="Tabungan" fill="#eab308" radius={[4, 4, 0, 0]} />
                <Bar dataKey="target" name="Target" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
