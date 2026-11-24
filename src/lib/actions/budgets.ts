"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { getMonthBounds } from "@/lib/finance";
import { revalidateFinance } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { budgetSchema, type BudgetInput } from "@/lib/validations";

export async function saveBudget(
  id: string | null,
  input: BudgetInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data anggaran tidak valid.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const { start } = getMonthBounds(parsed.data.month);
  const supabase = await createClient();
  const payload = {
    user_id: user.id,
    category_id: parsed.data.category_id || null,
    month: start,
    amount: parsed.data.amount,
  };

  const { error } = id
    ? await supabase.from("budgets").update(payload).eq("id", id).eq("user_id", user.id)
    : await supabase.from("budgets").insert(payload);

  if (error) {
    return {
      success: false,
      message: "Anggaran untuk kategori dan bulan ini sudah ada.",
    };
  }

  revalidateFinance();
  return { success: true, message: "Anggaran berhasil disimpan." };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Anggaran berhasil dihapus." };
}
