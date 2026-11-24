"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import { todayISO } from "@/lib/format";
import type { Category, Transaction, TransactionType } from "@/lib/types";
import { transactionSchema, type TransactionInput } from "@/lib/validations";

interface TransactionDialogProps {
  categories: Category[];
  transaction?: Transaction | null;
  fixedType?: TransactionType;
  trigger?: ReactNode;
  defaultDate?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function TransactionDialog({
  categories,
  transaction,
  fixedType,
  trigger,
  defaultDate,
  open: controlledOpen,
  onOpenChange,
}: TransactionDialogProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const open = controlledOpen ?? internalOpen;

  function setOpen(value: boolean) {
    if (onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  }

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      name: "",
      amount: 0,
      type: fixedType ?? "expense",
      category_id: null,
      transaction_date: defaultDate ?? todayISO(),
      notes: "",
    },
  });

  const type = fixedType ?? (form.watch("type") as TransactionType);
  const availableCategories = categories.filter((item) => item.type === type);

  useEffect(() => {
    if (!open) return;
    form.reset(
      transaction
        ? {
            name: transaction.name,
            amount: Number(transaction.amount),
            type: transaction.type,
            category_id: transaction.category_id,
            transaction_date: transaction.transaction_date,
            notes: transaction.notes ?? "",
          }
        : {
            name: "",
            amount: 0,
            type: fixedType ?? "expense",
            category_id: null,
            transaction_date: defaultDate ?? todayISO(),
            notes: "",
          },
    );
  }, [open, transaction, fixedType, defaultDate, form]);

  useEffect(() => {
    const currentCategory = form.getValues("category_id");
    if (currentCategory && !availableCategories.some((item) => item.id === currentCategory)) {
      form.setValue("category_id", null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  async function onSubmit(values: TransactionInput) {
    setPending(true);
    const result = transaction
      ? await updateTransaction(transaction.id, values)
      : await createTransaction(values);
    setPending(false);

    if (result.success) {
      toast.success(result.message ?? " Berhasil disimpan.");
      setOpen(false);
      form.reset();
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menyimpan transaksi.");
    }
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {onOpenChange ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="size-4" />
              Tambah Transaksi
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{transaction ? "Edit Transaksi" : "Tambah Transaksi"}</DialogTitle>
          <DialogDescription>
            {transaction
              ? "Perbarui detail transaksi. Perhitungan keuangan akan otomatis menyesuaikan."
              : "Catat transaksi baru. Dashboard akan diperbarui secara otomatis."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("type")} />

          <div className="space-y-1.5">
            <Label htmlFor="transaction-name">Nama Transaksi</Label>
            <Input
              id="transaction-name"
              placeholder="Contoh: Gaji bulanan"
              {...form.register("name")}
            />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="transaction-amount">Nominal</Label>
              <Input
                id="transaction-amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {errors.amount ? (
                <p className="text-xs text-destructive">{errors.amount.message}</p>
              ) : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="transaction-date">Tanggal</Label>
              <Input id="transaction-date" type="date" {...form.register("transaction_date")} />
              {errors.transaction_date ? (
                <p className="text-xs text-destructive">{errors.transaction_date.message}</p>
              ) : null}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {!fixedType ? (
              <div className="space-y-1.5">
                <Label>Jenis</Label>
                <Controller
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Pemasukan</SelectItem>
                        <SelectItem value="expense">Pengeluaran</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label>Kategori</Label>
              <Controller
                control={form.control}
                name="category_id"
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) => field.onChange(value === "none" ? null : value)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih kategori" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tanpa kategori</SelectItem>
                      {availableCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.category_id ? (
                <p className="text-xs text-destructive">{errors.category_id.message}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="transaction-notes">Catatan (opsional)</Label>
            <Textarea
              id="transaction-notes"
              rows={3}
              placeholder="Tambahkan catatan atau deskripsi"
              {...form.register("notes")}
            />
            {errors.notes ? <p className="text-xs text-destructive">{errors.notes.message}</p> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : transaction ? "Simpan Perubahan" : "Simpan Transaksi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
