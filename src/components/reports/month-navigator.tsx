import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { shiftMonth } from "@/lib/finance";
import { formatMonthLabel } from "@/lib/format";

export function MonthNavigator({ month, basePath }: { month: string; basePath: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="icon-sm" asChild>
        <a href={`${basePath}?month=${shiftMonth(month, -1)}`} aria-label="Bulan sebelumnya">
          <ChevronLeft className="size-4" />
        </a>
      </Button>
      <form method="GET" action={basePath}>
        <Input type="month" name="month" defaultValue={month} className="w-40" />
      </form>
      <span className="min-w-32 text-sm font-medium">{formatMonthLabel(month)}</span>
      <Button variant="outline" size="icon-sm" asChild>
        <a href={`${basePath}?month=${shiftMonth(month, 1)}`} aria-label="Bulan berikutnya">
          <ChevronRight className="size-4" />
        </a>
      </Button>
    </div>
  );
}
