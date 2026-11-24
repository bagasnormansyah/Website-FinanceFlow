import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { RecurringRule } from "@/lib/types";

export async function getRecurringRules(userId: string): Promise<RecurringRule[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recurring_rules")
    .select("*, categories(id, name, color, icon)")
    .eq("user_id", userId)
    .order("start_date", { ascending: false });

  if (error) {
    console.error("getRecurringRules:", error.message);
    return [];
  }
  return (data ?? []).map((item) => ({
    ...item,
    amount: Number(item.amount),
  })) as RecurringRule[];
}
