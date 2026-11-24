import { AppShell } from "@/components/layout/app-shell";
import { RealtimeRefresh } from "@/components/providers/realtime-refresh";
import { requireUser } from "@/lib/auth/dal";

// Setiap halaman di dalam grup ini membaca sesi Supabase dan searchParams,
// sehingga dirender pada request time sesuai pola Cache Components.
export const instant = false;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();

  return (
    <AppShell email={user.email ?? "Pengguna"}>
      <RealtimeRefresh userId={user.id} />
      {children}
    </AppShell>
  );
}
