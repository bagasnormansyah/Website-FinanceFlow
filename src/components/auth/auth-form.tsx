"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth/actions";
import { loginSchema, registerSchema } from "@/lib/validations";

type LoginValues = { email: string; password: string };
type RegisterValues = { fullName: string; email: string; password: string; confirmPassword: string };

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const isLogin = mode === "login";

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });
  const registerForm = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "", confirmPassword: "" },
  });

  async function handleLogin(values: LoginValues) {
    setPending(true);
    const result = await signIn(values);
    setPending(false);
    if (result.success) {
      toast.success(result.message ?? "Berhasil masuk.");
      router.push("/dashboard");
      router.refresh();
    } else {
      toast.error(result.message ?? "Gagal masuk.");
    }
  }

  async function handleRegister(values: RegisterValues) {
    setPending(true);
    const result = await signUp(values);

    if (!result.success) {
      setPending(false);
      toast.error(result.message ?? "Gagal membuat akun.");
      return;
    }

    toast.success(result.message ?? "Akun dibuat.");

    // Supabase mengharuskan verifikasi email secara default. Jangan mencoba
    // login otomatis jika sesi belum terbentuk, karena pasti akan gagal.
    if (result.data?.requiresConfirmation) {
      setPending(false);
      toast.info("Buka email Anda dan klik link verifikasi, lalu silakan masuk.");
      return;
    }

    const signInResult = await signIn({ email: values.email, password: values.password });
    setPending(false);

    if (signInResult.success) {
      router.push("/dashboard");
      router.refresh();
      return;
    }

    toast.error(signInResult.message ?? "Gagal masuk otomatis. Silakan masuk manual.");
    router.push("/login");
  }

  const form = isLogin ? loginForm : registerForm;
  const errors = form.formState.errors as Record<string, { message?: string } | undefined>;

  return (
    <div className="w-full max-w-md space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-blue-600 text-white">
          <Wallet className="size-6" />
        </span>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">FinanceFlow</h1>
          <p className="text-sm text-muted-foreground">Personal Finance Management System</p>
        </div>
      </div>

      <div className="rounded-2xl border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-1">
          <h2 className="text-xl font-semibold">{isLogin ? "Selamat datang kembali" : "Buat akun baru"}</h2>
          <p className="text-sm text-muted-foreground">
            {isLogin
              ? "Masuk untuk mengelola keuangan Anda."
              : "Mulai lacak pemasukan, pengeluaran, dan anggaran Anda."}
          </p>
        </div>

        {isLogin ? (
          <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Email</Label>
              <Input id="login-email" type="email" placeholder="nama@email.com" {...loginForm.register("email")} />
              {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <Input id="login-password" type="password" {...loginForm.register("password")} />
              {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Masuk"}
            </Button>
          </form>
        ) : (
          <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="register-name">Nama Lengkap</Label>
              <Input id="register-name" placeholder="Nama Anda" {...registerForm.register("fullName")} />
              {errors.fullName ? <p className="text-xs text-destructive">{errors.fullName.message}</p> : null}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="register-email">Email</Label>
              <Input id="register-email" type="email" placeholder="nama@email.com" {...registerForm.register("email")} />
              {errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="register-password">Password</Label>
                <Input id="register-password" type="password" {...registerForm.register("password")} />
                {errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="register-confirm">Konfirmasi</Label>
                <Input id="register-confirm" type="password" {...registerForm.register("confirmPassword")} />
                {errors.confirmPassword ? (
                  <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>
                ) : null}
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" /> : "Daftar"}
            </Button>
          </form>
        )}

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
          <Link
            href={isLogin ? "/register" : "/login"}
            className="font-medium text-blue-500 hover:underline"
          >
            {isLogin ? "Daftar sekarang" : "Masuk"}
          </Link>
        </p>
      </div>
    </div>
  );
}
