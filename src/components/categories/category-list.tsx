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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteCategory } from "@/lib/actions/categories";
import type { Category } from "@/lib/types";
import { CategoryDialog } from "@/components/categories/category-dialog";

function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
}: {
  category: Category;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    setPending(true);
    const result = await deleteCategory(category.id);
    setPending(false);
    if (result.success) {
      toast.success(result.message ?? "Kategori dihapus.");
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal menghapus kategori.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus kategori?</DialogTitle>
          <DialogDescription>
            Kategori &quot;{category.name}&quot; akan dihapus. Transaksi yang menggunakan kategori
            ini tetap tersimpan tanpa kategori.
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

function Row({ category }: { category: Category }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell>
          <div className="flex items-center gap-2.5">
            <span
              className="size-3 rounded-full"
              style={{ backgroundColor: category.color }}
              aria-hidden
            />
            <span className="font-medium">{category.name}</span>
          </div>
        </TableCell>
        <TableCell className="text-muted-foreground">{category.icon}</TableCell>
        <TableCell>
          {category.is_savings ? <Badge className="bg-amber-500/15 text-amber-500">Tabungan</Badge> : null}
          {category.is_default ? <Badge variant="secondary">Bawaan</Badge> : null}
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
              <DropdownMenuItem
                onSelect={() => setDeleteOpen(true)}
                variant="destructive"
                disabled={category.is_default}
              >
                <Trash2 className="size-4" /> Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      {editOpen ? (
        <CategoryDialog
          type={category.type}
          category={category}
          open={editOpen}
          onOpenChange={setEditOpen}
        />
      ) : null}
      <DeleteCategoryDialog category={category} open={deleteOpen} onOpenChange={setDeleteOpen} />
    </>
  );
}

export function CategoryList({ categories }: { categories: Category[] }) {
  if (categories.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-10 text-center text-sm text-muted-foreground">
        Belum ada kategori. Tambahkan kategori pertama Anda.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama</TableHead>
            <TableHead>Ikon</TableHead>
            <TableHead>Label</TableHead>
            <TableHead className="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => (
            <Row key={category.id} category={category} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
