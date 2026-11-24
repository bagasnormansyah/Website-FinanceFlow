"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { getCategoryById } from "@/lib/data/categories";
import { revalidateFinance } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { transactionSchema, type TransactionInput } from "@/lib/validations";

function errorsFrom(error: { flatten: () => { fieldErrors: Record<string, string[]> } }) {
  return error.flatten().fieldErrors;
}

async function validateCategory(categoryId: string | null | undefined, userId: string, type: "income" | "expense") {
  if (!categoryId) return { ok: true as const };
  const category = await getCategoryById(categoryId, userId);
  if (!category) return { ok: false as const, message: "Kategori tidak ditemukan." };
  if (category.type !== type) {
    return { ok: false as const, message: "Kategori tidak sesuai dengan jenis transaksi." };
  }
  return { ok: true as const };
}

function toRow(input: TransactionInput, userId: string) {
  return {
    user_id: userId,
    name: input.name,
    amount: input.amount,
    type: input.type,
    category_id: input.category_id || null,
    transaction_date: input.transaction_date,
    notes: input.notes?.trim() || null,
  };
}

export async function createTransaction(input: TransactionInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Data transaksi tidak valid.", errors: errorsFrom(parsed.error) };
  }

  const categoryCheck = await validateCategory(parsed.data.category_id, user.id, parsed.data.type);
  if (!categoryCheck.ok) return { success: false, message: categoryCheck.message };

  const supabase = await createClient();
  const { error } = await supabase.from("transactions").insert(toRow(parsed.data, user.id));
  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Transaksi berhasil disimpan." };
}

export async function updateTransaction(
  id: string,
  input: TransactionInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = transactionSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Data transaksi tidak valid.", errors: errorsFrom(parsed.error) };
  }

  const categoryCheck = await validateCategory(parsed.data.category_id, user.id, parsed.data.type);
  if (!categoryCheck.ok) return { success: false, message: categoryCheck.message };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .update({ ...toRow(parsed.data, user.id), source: "manual", recurring_rule_id: null })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Transaksi berhasil diperbarui." };
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Transaksi berhasil dihapus." };
}
