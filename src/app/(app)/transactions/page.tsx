import type { Metadata } from "next";
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionFiltersBar } from "@/components/transactions/transaction-filters";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { getCategories } from "@/lib/data/categories";
import { getFilteredTransactions } from "@/lib/data/transactions";
import { formatNumber } from "@/lib/format";
import { firstParam, readPositiveInt, readString } from "@/lib/page-params";
import { PAGE_SIZE } from "@/lib/constants";
import type { TransactionFilters } from "@/lib/types";

export const metadata: Metadata = { title: "Transaksi" };

type SearchParams = Record<string, string | string[] | undefined>;

function buildHref(params: SearchParams, patch: Record<string, string>) {
  const merged: SearchParams = { ...params, ...patch };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    const raw = firstParam(value);
    if (raw && raw !== "all") query.set(key, raw);
  }
  const search = query.toString();
  return search ? `/transactions?${search}` : "/transactions";
}

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const user = await requireUser();

  const rawType = readString(params.type, "all");
  const rawSort = readString(params.sort, "transaction_date");
  const rawOrder = readString(params.order, "desc");

  const filters: TransactionFilters = {
    page: readPositiveInt(params.page, 1),
    search: readString(params.q) || undefined,
    type: rawType === "income" || rawType === "expense" ? rawType : "all",
    categoryId: readString(params.category) || undefined,
    from: readString(params.from) || undefined,
    to: readString(params.to) || undefined,
    sort:
      rawSort === "amount" || rawSort === "name" || rawSort === "transaction_date"
        ? rawSort
        : "transaction_date",
    order: rawOrder === "asc" ? "asc" : "desc",
  };

  const [categories, profile] = await Promise.all([getCategories(user.id), getProfile()]);
  const currency = profile?.currency ?? "IDR";
  const { data: transactions, count } = await getFilteredTransactions(user.id, filters);
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE));
  const currentPage = Math.min(filters.page ?? 1, pageCount);

  const sortLabel = filters.sort === "amount" ? "Nominal" : filters.sort === "name" ? "Nama" : "Tanggal";
  const OrderIcon = filters.order === "desc" ? ArrowDown : ArrowUp;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Semua Transaksi"
        description="Cari, filter, urutkan, edit, hapus, dan ekspor seluruh transaksi Anda ke CSV."
        actions={<TransactionDialog categories={categories} />}
      />

      <TransactionFiltersBar categories={categories} filters={filters} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Card className="gap-0 py-0">
          <CardContent className="px-4 py-2 text-sm text-muted-foreground">
            Menampilkan <span className="font-medium text-foreground">{transactions.length}</span> dari{" "}
            <span className="font-medium text-foreground">{formatNumber(count)}</span> transaksi
          </CardContent>
        </Card>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Urutkan:</span>
          <Button variant="outline" size="sm" asChild>
            <a
              href={buildHref(params, {
                sort: "transaction_date",
                order: filters.sort === "transaction_date" && filters.order === "desc" ? "asc" : "desc",
                page: "1",
              })}
            >
              Tanggal
              {filters.sort === "transaction_date" ? <OrderIcon className="size-3.5" /> : null}
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={buildHref(params, {
                sort: "amount",
                order: filters.sort === "amount" && filters.order === "desc" ? "asc" : "desc",
                page: "1",
              })}
            >
              Nominal
              {filters.sort === "amount" ? <OrderIcon className="size-3.5" /> : null}
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a
              href={buildHref(params, {
                sort: "name",
                order: filters.sort === "name" && filters.order === "desc" ? "asc" : "desc",
                page: "1",
              })}
            >
              Nama
              {filters.sort === "name" ? <OrderIcon className="size-3.5" /> : null}
            </a>
          </Button>
          <span className="sr-only">Urutan saat ini: {sortLabel}</span>
        </div>
      </div>

      <TransactionTable transactions={transactions} categories={categories} currency={currency} />

      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Halaman {currentPage} dari {pageCount}
        </p>
        <div className="flex items-center gap-2">
          {currentPage > 1 ? (
            <Button variant="outline" size="sm" asChild>
              <a href={buildHref(params, { page: String(currentPage - 1) })}>
                <ChevronLeft className="size-4" /> Sebelumnya
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              <ChevronLeft className="size-4" /> Sebelumnya
            </Button>
          )}
          {currentPage < pageCount ? (
            <Button variant="outline" size="sm" asChild>
              <a href={buildHref(params, { page: String(currentPage + 1) })}>
                Berikutnya <ChevronRight className="size-4" />
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Berikutnya <ChevronRight className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
