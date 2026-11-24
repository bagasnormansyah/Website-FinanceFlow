import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth/dal";
import { getAllTransactionsForExport } from "@/lib/data/transactions";
import { formatDate, todayISO } from "@/lib/format";
import type { TransactionFilters } from "@/lib/types";

function escapeCsv(value: string | number | null | undefined) {
  const text = value == null ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = request.nextUrl.searchParams;
  const filters: TransactionFilters = {
    search: params.get("q") ?? undefined,
    type: (params.get("type") as TransactionFilters["type"]) ?? "all",
    categoryId: params.get("category") ?? undefined,
    from: params.get("from") ?? undefined,
    to: params.get("to") ?? undefined,
    sort: (params.get("sort") as TransactionFilters["sort"]) ?? "transaction_date",
    order: (params.get("order") as TransactionFilters["order"]) ?? "desc",
  };

  const transactions = await getAllTransactionsForExport(user.id, filters);
  const rows = [
    ["Tanggal", "Nama Transaksi", "Kategori", "Jenis", "Nominal", "Catatan"],
    ...transactions.map((item) => [
      formatDate(item.transaction_date),
      item.name,
      item.categories?.name ?? "Tanpa Kategori",
      item.type === "income" ? "Pemasukan" : "Pengeluaran",
      item.amount,
      item.notes ?? "",
    ]),
  ];

  const csv = `\uFEFF${rows.map((row) => row.map(escapeCsv).join(",")).join("\r\n")}`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="transactions-${todayISO()}.csv"`,
    },
  });
}
