"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { revalidateFinance } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { recurringRuleSchema, type RecurringRuleInput } from "@/lib/validations";

function toRow(input: RecurringRuleInput, userId: string) {
  return {
    user_id: userId,
    name: input.name,
    amount: input.amount,
    type: input.type,
    category_id: input.category_id || null,
    frequency: input.frequency,
    start_date: input.start_date,
    end_date: input.end_date || null,
    is_active: input.is_active,
  };
}

export async function createRecurringRule(input: RecurringRuleInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = recurringRuleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data transaksi berulang tidak valid.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_rules")
    .insert(toRow(parsed.data, user.id));

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Transaksi berulang berhasil dibuat." };
}

export async function updateRecurringRule(
  id: string,
  input: RecurringRuleInput,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = recurringRuleSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data transaksi berulang tidak valid.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_rules")
    .update(toRow(parsed.data, user.id))
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Transaksi berulang berhasil diperbarui." };
}

export async function toggleRecurringRule(id: string, isActive: boolean): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_rules")
    .update({ is_active: isActive })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Status berhasil diperbarui." };
}

export async function deleteRecurringRule(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("recurring_rules")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Transaksi berulang berhasil dihapus." };
}
