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
import { Switch } from "@/components/ui/switch";
import { createRecurringRule, updateRecurringRule } from "@/lib/actions/recurring";
import { FREQUENCIES } from "@/lib/constants";
import { todayISO } from "@/lib/format";
import type { Category, RecurringRule } from "@/lib/types";
import { recurringRuleSchema, type RecurringRuleInput } from "@/lib/validations";

export function RecurringDialog({
  categories,
  rule,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  categories: Category[];
  rule?: RecurringRule | null;
  trigger?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const open = controlledOpen ?? internalOpen;

  function setOpen(value: boolean) {
    if (onOpenChange) onOpenChange(value);
    else setInternalOpen(value);
  }

  const form = useForm<RecurringRuleInput>({
    resolver: zodResolver(recurringRuleSchema),
    defaultValues: {
      name: "",
      amount: 0,
      type: "expense",
      category_id: null,
      frequency: "monthly",
      start_date: todayISO(),
      end_date: null,
      is_active: true,
    },
  });

  const type = form.watch("type");
  const availableCategories = categories.filter((category) => category.type === type);

  useEffect(() => {
    if (!open) return;
    form.reset(
      rule
        ? {
            name: rule.name,
            amount: Number(rule.amount),
            type: rule.type,
            category_id: rule.category_id,
            frequency: rule.frequency,
            start_date: rule.start_date,
            end_date: rule.end_date,
            is_active: rule.is_active,
          }
        : {
            name: "",
            amount: 0,
            type: "expense",
            category_id: null,
            frequency: "monthly",
            start_date: todayISO(),
            end_date: null,
            is_active: true,
          },
    );
  }, [open, rule, form]);

  async function onSubmit(values: RecurringRuleInput) {
    setPending(true);
    const result = rule
      ? await updateRecurringRule(rule.id, values)
      : await createRecurringRule(values);
    setPending(false);
    if (result.success) {
      toast.success(result.message ?? "Transaksi berulang disimpan.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menyimpan transaksi berulang.");
    }
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {onOpenChange ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="size-4" /> Tambah Aturan
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{rule ? "Edit Transaksi Berulang" : "Tambah Transaksi Berulang"}</DialogTitle>
          <DialogDescription>
            Sistem akan membuat transaksi otomatis sesuai jadwal tanpa duplikat.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="recurring-name">Nama Transaksi</Label>
            <Input id="recurring-name" placeholder="Contoh: Gaji bulanan" {...form.register("name")} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="recurring-amount">Nominal</Label>
              <Input
                id="recurring-amount"
                type="number"
                min="0"
                step="0.01"
                {...form.register("amount", { valueAsNumber: true })}
              />
              {errors.amount ? <p className="text-xs text-destructive">{errors.amount.message}</p> : null}
            </div>
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
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Frekuensi</Label>
              <Controller
                control={form.control}
                name="frequency"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FREQUENCIES.map((frequency) => (
                        <SelectItem key={frequency.value} value={frequency.value}>
                          {frequency.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
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
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="recurring-start">Tanggal Mulai</Label>
              <Input id="recurring-start" type="date" {...form.register("start_date")} />
              {errors.start_date ? <p className="text-xs text-destructive">{errors.start_date.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="recurring-end">Tanggal Berakhir (opsional)</Label>
              <Input
                id="recurring-end"
                type="date"
                {...form.register("end_date", { setValueAs: (value) => value || null })}
              />
              {errors.end_date ? <p className="text-xs text-destructive">{errors.end_date.message}</p> : null}
            </div>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <Label htmlFor="recurring-active">Status aktif</Label>
            <Controller
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <Switch id="recurring-active" checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
