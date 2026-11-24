import Link from "next/link";
import { Download, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Category, TransactionFilters } from "@/lib/types";

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30";

export function TransactionFiltersBar({
  categories,
  filters,
}: {
  categories: Category[];
  filters: TransactionFilters;
}) {
  const query = new URLSearchParams();
  if (filters.search) query.set("q", filters.search);
  if (filters.type && filters.type !== "all") query.set("type", filters.type);
  if (filters.categoryId) query.set("category", filters.categoryId);
  if (filters.from) query.set("from", filters.from);
  if (filters.to) query.set("to", filters.to);
  query.set("sort", filters.sort ?? "transaction_date");
  query.set("order", filters.order ?? "desc");

  return (
    <form method="GET" action="/transactions" className="space-y-3 rounded-xl border bg-card p-4">
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <div className="relative lg:col-span-2">
          <Search className="pointer-events-none absolute top-2 left-2.5 size-4 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={filters.search ?? ""}
            placeholder="Cari nama transaksi..."
            className="pl-8"
          />
        </div>
        <select name="type" defaultValue={filters.type ?? "all"} className={selectClass}>
          <option value="all">Semua jenis</option>
          <option value="income">Pemasukan</option>
          <option value="expense">Pengeluaran</option>
        </select>
        <select name="category" defaultValue={filters.categoryId ?? ""} className={selectClass}>
          <option value="">Semua kategori</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <Input name="from" type="date" defaultValue={filters.from ?? ""} aria-label="Dari tanggal" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Input name="to" type="date" defaultValue={filters.to ?? ""} aria-label="Sampai tanggal" className="w-full sm:w-48" />
        <input type="hidden" name="sort" value={filters.sort ?? "transaction_date"} />
        <input type="hidden" name="order" value={filters.order ?? "desc"} />
        <Button type="submit" size="sm">
          Terapkan Filter
        </Button>
        <Button type="button" variant="ghost" size="sm" asChild>
          <Link href="/transactions">
            <X className="size-4" /> Reset
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild className="ml-auto">
          <a href={`/api/transactions/export?${query.toString()}`}>
            <Download className="size-4" /> Export CSV
          </a>
        </Button>
      </div>
    </form>
  );
}
