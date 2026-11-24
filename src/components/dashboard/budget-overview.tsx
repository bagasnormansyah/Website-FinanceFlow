import Link from "next/link";
import { AlertTriangle, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency, percent } from "@/lib/format";
import type { BudgetSummary } from "@/lib/types";

export function BudgetOverview({ budget, currency }: { budget: BudgetSummary; currency: string }) {
  const overBudget = budget.percentage > 100;
  const warning = budget.percentage >= 80 && !overBudget;

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2">
            <Target className="size-4 text-blue-500" />
            Ringkasan Anggaran
          </CardTitle>
          <CardDescription>Penggunaan anggaran bulan berjalan.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/budgets">Kelola</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Total Anggaran</p>
            <p className="mt-1 text-sm font-semibold">{formatCurrency(budget.total, currency)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Terpakai</p>
            <p className="mt-1 text-sm font-semibold text-rose-500">
              {formatCurrency(budget.used, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tersisa</p>
            <p className="mt-1 text-sm font-semibold text-emerald-500">
              {formatCurrency(budget.remaining, currency)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Penggunaan</p>
            <p
              className={`mt-1 flex items-center gap-1 text-sm font-semibold ${
                overBudget ? "text-rose-500" : warning ? "text-amber-500" : ""
              }`}
            >
              {warning || overBudget ? <AlertTriangle className="size-3.5" /> : null}
              {percent(budget.percentage)}
            </p>
          </div>
        </div>

        {budget.items.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
            Belum ada anggaran.{" "}
            <Link href="/budgets" className="font-medium text-blue-500 hover:underline">
              Buat anggaran pertama Anda
            </Link>
            .
          </div>
        ) : (
          <div className="space-y-4">
            {budget.items.slice(0, 5).map((item) => {
              const value = Math.min(item.percentage, 100);
              return (
                <div key={item.id ?? item.categoryId ?? "overall"} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">{item.categoryName}</span>
                    <span className="text-muted-foreground">
                      {formatCurrency(item.used, currency)} / {formatCurrency(item.budget, currency)}
                    </span>
                  </div>
                  <Progress
                    value={value}
                    className="h-2"
                    indicatorClassName={
                      item.percentage > 100
                        ? "bg-rose-500"
                        : item.percentage >= 80
                          ? "bg-amber-500"
                          : "bg-blue-500"
                    }
                  />
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
