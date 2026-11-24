"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AlertTriangle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteBudget } from "@/lib/actions/budgets";
import { formatCurrency, formatMonthLabel, percent } from "@/lib/format";
import type { Budget, BudgetItem, Category } from "@/lib/types";
import { BudgetDialog } from "@/components/budgets/budget-dialog";

function DeleteBudgetDialog({
  budget,
  open,
  onOpenChange,
}: {
  budget: Budget;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteBudget(budget.id);
    setPending(false);
    if (result.success) {
      toast.success(result.message ?? "Anggaran dihapus.");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menghapus anggaran.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus anggaran?</DialogTitle>
          <DialogDescription>Anggaran ini akan dihapus dari rekap bulan berjalan.</DialogDescription>
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

function Row({
  item,
  categories,
  month,
  currency,
}: {
  item: BudgetItem;
  categories: Category[];
  month: string;
  currency: string;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const budget = {
    id: item.id ?? "",
    user_id: "",
    category_id: item.categoryId,
    month,
    amount: item.budget,
  } as Budget;

  return (
    <>
      <TableRow>
        <TableCell className="font-medium">{item.categoryName}</TableCell>
        <TableCell>{formatCurrency(item.budget, currency)}</TableCell>
        <TableCell className="text-rose-500">{formatCurrency(item.used, currency)}</TableCell>
        <TableCell className={item.remaining < 0 ? "text-rose-500" : "text-emerald-500"}>
          {formatCurrency(item.remaining, currency)}
        </TableCell>
        <TableCell>
          <div className="flex min-w-36 items-center gap-2">
            <Progress
              value={Math.min(item.percentage, 100)}
              className="h-2 flex-1"
              indicatorClassName={
                item.percentage > 100 ? "bg-rose-500" : item.percentage >= 80 ? "bg-amber-500" : "bg-blue-500"
              }
            />
            <span
              className={`flex w-12 items-center gap-0.5 text-xs font-medium ${
                item.percentage > 100 ? "text-rose-500" : item.percentage >= 80 ? "text-amber-500" : "text-muted-foreground"
              }`}
            >
              {item.percentage >= 80 ? <AlertTriangle className="size-3" /> : null}
              {percent(item.percentage)}
            </span>
          </div>
        </TableCell>
        <TableCell className="text-right">
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
        </TableCell>
      </TableRow>
      {editOpen && item.id ? (
        <BudgetDialog
          categories={categories}
          budget={budget}
          defaultMonth={month}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
      {item.id ? (
        <DeleteBudgetDialog budget={budget} open={deleteOpen} onOpenChange={setDeleteOpen} />
      ) : null}
    </>
  );
}

export function BudgetList({
  items,
  categories,
  month,
  currency,
}: {
  items: BudgetItem[];
  categories: Category[];
  month: string;
  currency: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Belum ada anggaran untuk {formatMonthLabel(month)}.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kategori</TableHead>
            <TableHead>Anggaran</TableHead>
            <TableHead>Terpakai</TableHead>
            <TableHead>Tersisa</TableHead>
            <TableHead>Penggunaan</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <Row
              key={item.id ?? item.categoryId ?? "overall"}
              item={item}
              categories={categories}
              month={month}
              currency={currency}
            />
          ))}
        </TableBody>
      </Table>
      <p className="sr-only">Mata uang: {currency}</p>
    </div>
  );
}
