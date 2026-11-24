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
import { saveBudget } from "@/lib/actions/budgets";
import type { Budget, Category } from "@/lib/types";
import { budgetSchema, type BudgetInput } from "@/lib/validations";

export function BudgetDialog({
  categories,
  budget,
  defaultMonth,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  categories: Category[];
  budget?: Budget | null;
  defaultMonth: string;
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

  const form = useForm<BudgetInput>({
    resolver: zodResolver(budgetSchema),
    defaultValues: { category_id: null, month: defaultMonth, amount: 0 },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      budget
        ? {
            category_id: budget.category_id,
            month: budget.month.slice(0, 7),
            amount: Number(budget.amount),
          }
        : { category_id: null, month: defaultMonth, amount: 0 },
    );
  }, [open, budget, defaultMonth, form]);

  async function onSubmit(values: BudgetInput) {
    setPending(true);
    const result = await saveBudget(budget?.id ?? null, values);
    setPending(false);
    if (result.success) {
      toast.success(result.message ?? "Anggaran disimpan.");
      setOpen(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menyimpan anggaran.");
    }
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {onOpenChange ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="size-4" /> Tambah Anggaran
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Anggaran" : "Tambah Anggaran"}</DialogTitle>
          <DialogDescription>
            Tentukan batas pengeluaran untuk satu kategori pada bulan tertentu.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Bulan</Label>
            <Input type="month" {...form.register("month")} />
            {errors.month ? <p className="text-xs text-destructive">{errors.month.message}</p> : null}
          </div>
          <div className="space-y-1.5">
            <Label>Kategori</Label>
            <Controller
              control={form.control}
              name="category_id"
              render={({ field }) => (
                <Select
                  value={field.value ?? "all"}
                  onValueChange={(value) => field.onChange(value === "all" ? null : value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Pengeluaran</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="budget-amount">Nominal Anggaran</Label>
            <Input
              id="budget-amount"
              type="number"
              min="0"
              step="0.01"
              {...form.register("amount", { valueAsNumber: true })}
            />
            {errors.amount ? <p className="text-xs text-destructive">{errors.amount.message}</p> : null}
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
