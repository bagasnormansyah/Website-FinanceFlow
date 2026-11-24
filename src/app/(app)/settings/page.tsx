import type { Metadata } from "next";
import { Database, ShieldCheck, UserRound } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/page-header";
import { ProfileForm } from "@/components/settings/profile-form";
import { getProfile, requireUser } from "@/lib/auth/dal";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Pengaturan" };

export default async function SettingsPage() {
  const user = await requireUser();
  const profile = await getProfile();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pengaturan"
        description="Kelola profil dan preferensi mata uang aplikasi Anda."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="size-4 text-blue-500" />
              Profil Pengguna
            </CardTitle>
            <CardDescription>Perubahan mata uang langsung diterapkan pada seluruh tampilan nominal.</CardDescription>
          </CardHeader>
          <CardContent>
            <ProfileForm
              profile={profile ?? { id: user.id, full_name: null, currency: "IDR" }}
              email={user.email ?? "Pengguna"}
            />
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Database className="size-4 text-blue-500" />
                Koneksi Database
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Status Supabase</span>
                <span className={isSupabaseConfigured ? "text-emerald-500" : "text-amber-500"}>
                  {isSupabaseConfigured ? "Terkonfigurasi" : "Perlu environment"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">User ID</span>
                <span className="max-w-32 truncate font-mono text-xs">{user.id.slice(0, 8)}…</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShieldCheck className="size-4 text-emerald-500" />
                Keamanan Data
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Setiap data dilindungi Row Level Security (RLS). Hanya pemilik data yang dapat membaca, mengubah,
              atau menghapus transaksi, kategori, anggaran, dan aturan berulang mereka.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
