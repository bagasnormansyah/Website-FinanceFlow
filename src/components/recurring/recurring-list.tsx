"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteRecurringRule, toggleRecurringRule } from "@/lib/actions/recurring";
import { FREQUENCIES } from "@/lib/constants";
import { formatCurrency, formatDate, todayISO } from "@/lib/format";
import { addOneDay, occurrenceAt } from "@/lib/recurring";
import type { Category, RecurringRule } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RecurringDialog } from "@/components/recurring/recurring-dialog";

function nextOccurrence(rule: RecurringRule) {
  const lowerBound = rule.last_generated_date
    ? addOneDay(rule.last_generated_date)
    : rule.start_date;
  const today = todayISO();
  for (let index = 0; index < 10000; index += 1) {
    const date = occurrenceAt(rule.start_date, rule.frequency, index);
    if (date > today) break;
    if (date >= lowerBound && (!rule.end_date || date <= rule.end_date)) return date;
  }
  return null;
}

function DeleteRuleDialog({
  rule,
  open,
  onOpenChange,
}: {
  rule: RecurringRule;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteRecurringRule(rule.id);
    setPending(false);
    if (result.success) {
      toast.success(result.message ?? "Aturan dihapus.");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menghapus aturan.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus aturan berulang?</DialogTitle>
          <DialogDescription>
            Transaksi yang sudah dibuat tidak akan dihapus, tetapi jadwal ini tidak akan berjalan lagi.
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

function Row({ rule, categories, currency }: { rule: RecurringRule; categories: Category[]; currency: string }) {
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingToggle, setPendingToggle] = useState(false);
  const frequencyLabel = FREQUENCIES.find((item) => item.value === rule.frequency)?.label ?? rule.frequency;
  const next = nextOccurrence(rule);

  async function handleToggle(value: boolean) {
    setPendingToggle(true);
    const result = await toggleRecurringRule(rule.id, value);
    setPendingToggle(false);
    if (result.success) {
      toast.success(result.message ?? "Status diperbarui.");
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal memperbarui status.");
    }
  }

  return (
    <>
      <TableRow>
        <TableCell>
          <p className="font-medium">{rule.name}</p>
          <p className="text-xs text-muted-foreground">{rule.categories?.name ?? "Tanpa kategori"}</p>
        </TableCell>
        <TableCell>
          <Badge
            variant="outline"
            className={rule.type === "income" ? "border-emerald-500/30 text-emerald-500" : "border-rose-500/30 text-rose-500"}
          >
            {rule.type === "income" ? "Pemasukan" : "Pengeluaran"}
          </Badge>
        </TableCell>
        <TableCell className="font-semibold tabular-nums">{formatCurrency(Number(rule.amount), currency)}</TableCell>
        <TableCell>{frequencyLabel}</TableCell>
        <TableCell className="text-muted-foreground">
          {next ? formatDate(next) : rule.end_date ? "Selesai" : "-"}
        </TableCell>
        <TableCell>
          <Switch
            checked={rule.is_active}
            onCheckedChange={handleToggle}
            disabled={pendingToggle}
            aria-label="Aktifkan aturan"
          />
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
      {editOpen ? (
        <RecurringDialog
          categories={categories}
          rule={rule}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
      <DeleteRuleDialog rule={rule} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

export function RecurringList({
  rules,
  categories,
  currency,
}: {
  rules: RecurringRule[];
  categories: Category[];
  currency: string;
}) {
  if (rules.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Belum ada transaksi berulang. Tambahkan aturan untuk otomatisasi transaksi rutin Anda.
      </div>
    );
  }

  return (
    <div className={cn("overflow-x-auto rounded-lg border")}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead>Nominal</TableHead>
            <TableHead>Frekuensi</TableHead>
            <TableHead>Terjadwal Berikutnya</TableHead>
            <TableHead>Aktif</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rules.map((rule) => (
            <Row key={rule.id} rule={rule} categories={categories} currency={currency} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
