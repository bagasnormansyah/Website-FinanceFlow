import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number;
  currency: string;
  icon: LucideIcon;
  change?: number;
  tone?: "default" | "income" | "expense" | "warning";
  hint?: string;
}

const toneClasses = {
  default: "bg-blue-500/10 text-blue-500",
  income: "bg-emerald-500/10 text-emerald-500",
  expense: "bg-rose-500/10 text-rose-500",
  warning: "bg-amber-500/10 text-amber-500",
};

export function StatCard({
  title,
  value,
  currency,
  icon: Icon,
  change,
  tone = "default",
  hint,
}: StatCardProps) {
  const changePositive = typeof change === "number" && change > 0;
  const changeNegative = typeof change === "number" && change < 0;

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-row items-center justify-between gap-2 py-4">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <span className={cn("flex size-8 items-center justify-center rounded-lg", toneClasses[tone])}>
          <Icon className="size-4" />
        </span>
      </CardHeader>
      <CardContent className="pb-5">
        <div className="text-2xl font-semibold tracking-tight">
          {formatCurrency(value, currency)}
        </div>
        <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          {typeof change === "number" ? (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 font-medium",
                changePositive ? "text-emerald-500" : changeNegative ? "text-rose-500" : "text-muted-foreground",
              )}
            >
              {changePositive ? (
                <ArrowUpRight className="size-3" />
              ) : changeNegative ? (
                <ArrowDownRight className="size-3" />
              ) : null}
              {Math.abs(change).toFixed(1)}%
            </span>
          ) : null}
          <span>{hint ?? "dibanding bulan lalu"}</span>
        </div>
      </CardContent>
    </Card>
  );
}
