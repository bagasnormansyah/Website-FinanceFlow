"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { useSyncExternalStore, useState } from "react";
import { toast } from "sonner";
import {
  ArrowDownLeft,
  ArrowLeftRight,
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Repeat,
  Settings,
  Sun,
  Tags,
  Target,
  Wallet,
} from "lucide-react";
import { signOut } from "@/lib/auth/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const subscribeToNothing = () => () => {};

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/income", label: "Pemasukan", icon: ArrowDownLeft },
  { href: "/expense", label: "Pengeluaran", icon: ArrowUpRight },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/budgets", label: "Anggaran", icon: Target },
  { href: "/reports", label: "Laporan", icon: BarChart3 },
  { href: "/recurring", label: "Transaksi Berulang", icon: Repeat },
  { href: "/categories", label: "Kategori", icon: Tags },
  { href: "/settings", label: "Pengaturan", icon: Settings },
];

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {navItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function SidebarBrand() {
  return (
    <div className="flex h-16 items-center gap-2.5 px-6">
      <span className="flex size-9 items-center justify-center rounded-xl bg-blue-600 text-white">
        <Wallet className="size-5" />
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold">FinanceFlow</div>
        <div className="text-[11px] text-sidebar-foreground/60">Personal Finance</div>
      </div>
    </div>
  );
}

export function AppShell({
  children,
  email,
  year,
}: {
  children: React.ReactNode;
  email: string;
  year: number;
}) {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const initials = email.slice(0, 2).toUpperCase();

  // next-themes hanya mengetahui tema setelah hydration. `useSyncExternalStore`
  // memakai snapshot server saat hydration, lalu snapshot client setelahnya,
  // sehingga ikon yang dirender tidak menyebabkan hydration mismatch.
  const mounted = useSyncExternalStore(
    subscribeToNothing,
    () => true,
    () => false,
  );

  async function handleSignOut() {
    const result = await signOut();
    if (result.success) {
      toast.success(result.message);
      router.push("/login");
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal keluar.");
    }
  }

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex">
        <SidebarBrand />
        <SidebarNav />
        <div className="border-t border-sidebar-border p-4 text-xs text-sidebar-foreground/50">
          © {year} FinanceFlow
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/90 px-4 backdrop-blur sm:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
                <span className="sr-only">Buka menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-sidebar p-0 text-sidebar-foreground">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigasi</SheetTitle>
                <SheetDescription>Menu aplikasi keuangan</SheetDescription>
              </SheetHeader>
              <SidebarBrand />
              <SidebarNav onNavigate={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">Panel Keuangan Pribadi</p>
            <p className="hidden text-xs text-muted-foreground sm:block">
              Kelola pemasukan, pengeluaran, dan anggaran Anda dalam satu tempat.
            </p>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            aria-label="Ganti tema"
          >
            {mounted && resolvedTheme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-1.5">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-blue-600 text-xs text-white">{initials}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-40 truncate text-xs sm:block">{email}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate text-xs">{email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings">
                  <Settings className="size-4" /> Pengaturan
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut} variant="destructive">
                <LogOut className="size-4" /> Keluar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
