import type { Metadata } from "next";
import { CalendarClock, CircleCheck, CirclePause } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RecurringDialog } from "@/components/recurring/recurring-dialog";
import { RecurringList } from "@/components/recurring/recurring-list";
import { PageHeader } from "@/components/layout/page-header";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { getCategories } from "@/lib/data/categories";
import { getRecurringRules } from "@/lib/data/recurring";

export const metadata: Metadata = { title: "Transaksi Berulang" };

export default async function RecurringPage() {
  const user = await requireUser();
  const [rules, categories, profile] = await Promise.all([
    getRecurringRules(user.id),
    getCategories(user.id),
    getProfile(),
  ]);
  const currency = profile?.currency ?? "IDR";
  const active = rules.filter((item) => item.is_active).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Transaksi Berulang"
        description="Otomatisasi transaksi harian, mingguan, bulanan, atau tahunan. Setiap tanggal hanya dibuat sekali."
        actions={<RecurringDialog categories={categories} />}
      />

      <section className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Aturan</CardTitle>
            <CalendarClock className="size-4 text-blue-500" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold">{rules.length}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aturan Aktif</CardTitle>
            <CircleCheck className="size-4 text-emerald-500" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-emerald-500">{active}</CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Aturan Nonaktif</CardTitle>
            <CirclePause className="size-4 text-amber-500" />
          </CardHeader>
          <CardContent className="text-2xl font-semibold text-amber-500">{rules.length - active}</CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Transaksi Berulang</CardTitle>
          <CardDescription>
            Transaksi dibuat otomatis oleh scheduler harian. Untuk deployment Vercel, cron dijalankan melalui
            vercel.json. Untuk server lain, panggil endpoint /api/cron/recurring dengan header Authorization Bearer CRON_SECRET.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecurringList rules={rules} categories={categories} currency={currency} />
        </CardContent>
      </Card>
    </div>
  );
}
