import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";

export function RecentTransactions({
  transactions,
  currency,
}: {
  transactions: Transaction[];
  currency: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle>Transaksi Terbaru</CardTitle>
          <CardDescription>Aktivitas keuangan terakhir Anda.</CardDescription>
        </div>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/transactions">Lihat semua</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Belum ada transaksi. Mulai catat pemasukan atau pengeluaran pertama Anda.
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((item) => {
              const isIncome = item.type === "income";
              return (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-lg",
                      isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500",
                    )}
                  >
                    {isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.categories?.name ?? "Tanpa kategori"} · {formatDate(item.transaction_date)}
                    </p>
                  </div>
                  <p
                    className={cn(
                      "shrink-0 text-sm font-semibold tabular-nums",
                      isIncome ? "text-emerald-500" : "text-rose-500",
                    )}
                  >
                    {isIncome ? "+" : "-"}
                    {formatCurrency(item.amount, currency)}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
