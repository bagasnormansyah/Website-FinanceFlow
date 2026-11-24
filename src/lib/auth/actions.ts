"use server";

import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { loginSchema, registerSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/types";

function flatten(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return error.flatten().fieldErrors;
}

async function getAppOrigin() {
  const requestHeaders = await headers();
  const host =
    requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host");
  const proto =
    requestHeaders.get("x-forwarded-proto")?.split(",")[0] ??
    (host?.includes("localhost") ? "http" : "https");

  if (host) return `${proto}://${host}`;
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}

export async function signIn(input: { email: string; password: string }): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Periksa kembali input Anda.", errors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    console.error("signIn:", error.message);
    return { success: false, message: "Email atau password salah." };
  }

  return { success: true, message: "Berhasil masuk." };
}

export async function signUp(
  input: { fullName: string; email: string; password: string; confirmPassword: string },
): Promise<ActionResult<{ requiresConfirmation: boolean }>> {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Periksa kembali input Anda.", errors: flatten(parsed.error) };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      // Link verifikasi harus kembali ke domain tempat request register dibuat,
      // bukan localhost dari dashboard Supabase.
      emailRedirectTo: `${await getAppOrigin()}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    console.error("signUp:", error.message);
    return { success: false, message: error.message };
  }

  if (!data.session) {
    return {
      success: true,
      message: "Akun dibuat. Silakan cek email Anda untuk verifikasi sebelum masuk.",
      data: { requiresConfirmation: true },
    };
  }

  return { success: true, message: "Akun berhasil dibuat.", data: { requiresConfirmation: false } };
}

export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true, message: "Berhasil keluar." };
}
