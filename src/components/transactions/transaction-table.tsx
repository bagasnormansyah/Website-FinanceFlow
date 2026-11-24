"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowDownLeft, ArrowUpRight, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTransaction } from "@/lib/actions/transactions";
import { formatCurrency, formatDate } from "@/lib/format";
import type { Category, Transaction } from "@/lib/types";
import { cn } from "@/lib/utils";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";

function DeleteDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteTransaction(transaction.id);
    setPending(false);
    if (result.success) {
      toast.success(result.message ?? "Transaksi dihapus.");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menghapus transaksi.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus transaksi?</DialogTitle>
          <DialogDescription>
            Transaksi &quot;{transaction.name}&quot; akan dihapus permanen dan seluruh perhitungan
            keuangan akan disesuaikan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={pending}>
            {pending ? "Menghapus..." : "Hapus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RowActions({
  transaction,
  categories,
}: {
  transaction: Transaction;
  categories: Category[];
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm">
            <MoreHorizontal className="size-4" />
            <span className="sr-only">Aksi</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setEditOpen(true)}>
            <Pencil className="size-4" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setDeleteOpen(true)} variant="destructive">
            <Trash2 className="size-4" /> Hapus
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {editOpen ? (
        <TransactionDialog
          categories={categories}
          transaction={transaction}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
      <DeleteDialog transaction={transaction} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

export function TransactionTable({
  transactions,
  categories,
  currency,
}: {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
}) {
  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Tidak ada transaksi yang cocok dengan filter.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Transaksi</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Tanggal</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead className="text-right">Nominal</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((item) => {
            const isIncome = item.type === "income";
            return (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "flex size-8 items-center justify-center rounded-lg",
                        isIncome ? "bg-emerald-500/10 text-emerald-500" : "bg-rose-500/10 text-rose-500",
                      )}
                    >
                      {isIncome ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
                    </span>
                    <div className="min-w-0">
                      <p className="max-w-56 truncate font-medium">{item.name}</p>
                      {item.notes ? (
                        <p className="max-w-56 truncate text-xs text-muted-foreground">{item.notes}</p>
                      ) : null}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.categories?.name ?? "Tanpa kategori"}</Badge>
                </TableCell>
                <TableCell className="whitespace-nowrap text-muted-foreground">
                  {formatDate(item.transaction_date)}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={isIncome ? "border-emerald-500/30 text-emerald-500" : "border-rose-500/30 text-rose-500"}
                  >
                    {isIncome ? "Pemasukan" : "Pengeluaran"}
                  </Badge>
                </TableCell>
                <TableCell
                  className={cn(
                    "whitespace-nowrap text-right font-semibold tabular-nums",
                    isIncome ? "text-emerald-500" : "text-rose-500",
                  )}
                >
                  {isIncome ? "+" : "-"}
                  {formatCurrency(item.amount, currency)}
                </TableCell>
                <TableCell>
                  <RowActions transaction={item} categories={categories} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
