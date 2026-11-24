import type { Metadata } from "next";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDialog } from "@/components/categories/category-dialog";
import { CategoryList } from "@/components/categories/category-list";
import { PageHeader } from "@/components/layout/page-header";
import { requireUser } from "@/lib/auth/dal";
import { getCategories } from "@/lib/data/categories";

export const metadata: Metadata = { title: "Kategori" };

export default async function CategoriesPage() {
  const user = await requireUser();
  const categories = await getCategories(user.id);
  const income = categories.filter((item) => item.type === "income");
  const expense = categories.filter((item) => item.type === "expense");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Kategori"
        description="Kategori bawaan dibuat otomatis saat akun dibuat. Anda dapat menambahkan kategori custom sendiri."
      />

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ArrowDownLeft className="size-4 text-emerald-500" />
              Kategori Pemasukan
            </CardTitle>
            <CardDescription>{income.length} kategori tersedia.</CardDescription>
          </div>
          <CategoryDialog type="income" />
        </CardHeader>
        <CardContent>
          <CategoryList categories={income} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="size-4 text-rose-500" />
              Kategori Pengeluaran
            </CardTitle>
            <CardDescription>
              {expense.length} kategori tersedia. Tandai kategori sebagai tabungan agar dihitung terpisah.
            </CardDescription>
          </div>
          <CategoryDialog type="expense" />
        </CardHeader>
        <CardContent>
          <CategoryList categories={expense} />
        </CardContent>
      </Card>
    </div>
  );
}
