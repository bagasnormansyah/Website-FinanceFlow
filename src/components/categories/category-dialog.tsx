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
import { Switch } from "@/components/ui/switch";
import { createCategory, updateCategory } from "@/lib/actions/categories";
import type { Category, TransactionType } from "@/lib/types";
import { categorySchema, type CategoryInput } from "@/lib/validations";

export function CategoryDialog({
  type,
  category,
  trigger,
  open: controlledOpen,
  onOpenChange,
}: {
  type: TransactionType;
  category?: Category | null;
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

  const form = useForm<CategoryInput>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: "",
      type,
      color: "#3b82f6",
      icon: "circle",
      is_savings: false,
    },
  });

  useEffect(() => {
    if (!open) return;
    form.reset(
      category
        ? {
            name: category.name,
            type: category.type,
            color: category.color,
            icon: category.icon,
            is_savings: category.is_savings,
          }
        : {
            name: "",
            type,
            color: "#3b82f6",
            icon: "circle",
            is_savings: false,
          },
    );
  }, [open, category, type, form]);

  async function onSubmit(values: CategoryInput) {
    setPending(true);
    const result = category
      ? await updateCategory(category.id, values)
      : await createCategory(values);
    setPending(false);

    if (result.success) {
      toast.success(result.message ?? "Kategori disimpan.");
      setOpen(false);
      form.reset();
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menyimpan kategori.");
    }
  }

  const errors = form.formState.errors;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {onOpenChange ? null : (
        <DialogTrigger asChild>
          {trigger ?? (
            <Button>
              <Plus className="size-4" /> Tambah Kategori
            </Button>
          )}
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{category ? "Edit Kategori" : "Tambah Kategori"}</DialogTitle>
          <DialogDescription>
            Kategori membantu mengelompokkan transaksi dan laporan keuangan Anda.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <input type="hidden" {...form.register("type")} />
          <div className="space-y-1.5">
            <Label htmlFor="category-name">Nama Kategori</Label>
            <Input id="category-name" placeholder="Contoh: Transportasi" {...form.register("name")} />
            {errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="category-color">Warna</Label>
              <Input id="category-color" type="color" className="h-8 p-1" {...form.register("color")} />
              {errors.color ? <p className="text-xs text-destructive">{errors.color.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="category-icon">Ikon</Label>
              <Input id="category-icon" placeholder="circle" {...form.register("icon")} />
              {errors.icon ? <p className="text-xs text-destructive">{errors.icon.message}</p> : null}
            </div>
          </div>
          {type === "expense" ? (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="category-savings">Kategori tabungan</Label>
                <p className="text-xs text-muted-foreground">
                  Nominal akan dihitung sebagai tabungan, bukan pengeluaran.
                </p>
              </div>
              <Controller
                control={form.control}
                name="is_savings"
                render={({ field }) => (
                  <Switch id="category-savings" checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          ) : null}
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
