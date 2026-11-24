"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCompactCurrency, formatCurrency, formatShortMonth } from "@/lib/format";
import type { ReportData } from "@/lib/types";

const axisStyle = { fontSize: 11, fill: "currentColor", opacity: 0.6 };

export function ReportCharts({ report, currency }: { report: ReportData; currency: string }) {
  const monthly = report.monthly.map((item) => ({
    ...item,
    shortMonth: formatShortMonth(item.month),
  }));

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Rekap Bulanan {report.year}</CardTitle>
          <CardDescription>Pemasukan, pengeluaran, dan tabungan sepanjang tahun.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} className="text-border" />
              <XAxis dataKey="shortMonth" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                width={64}
                tickFormatter={(value) => formatCompactCurrency(Number(value), currency)}
              />
              <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="income" name="Pemasukan" fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expense" name="Pengeluaran" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="savings" name="Tabungan" fill="#eab308" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Komposisi Pengeluaran</CardTitle>
          <CardDescription>Kategori pengeluaran pada bulan terpilih.</CardDescription>
        </CardHeader>
        <CardContent className="h-[300px]">
          {report.categoryTotals.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Belum ada pengeluaran pada bulan ini.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={report.categoryTotals}
                  dataKey="amount"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={95}
                  paddingAngle={2}
                >
                  {report.categoryTotals.map((item) => (
                    <Cell key={item.categoryId ?? "none"} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(Number(value), currency)} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
