import "server-only";

import { createClient } from "@/lib/supabase/server";
import { getMonthBounds } from "@/lib/finance";
import type { Budget } from "@/lib/types";

export async function getBudgets(userId: string, month: string): Promise<Budget[]> {
  const supabase = await createClient();
  const { start } = getMonthBounds(month);
  const { data, error } = await supabase
    .from("budgets")
    .select("*, categories(id, name, color, icon)")
    .eq("user_id", userId)
    .eq("month", start)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getBudgets:", error.message);
    return [];
  }
  return (data ?? []).map((item) => ({ ...item, amount: Number(item.amount) })) as Budget[];
}
