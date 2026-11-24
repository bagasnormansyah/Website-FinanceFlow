import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { Category, TransactionType } from "@/lib/types";

export async function getCategories(
  userId: string,
  type?: TransactionType,
): Promise<Category[]> {
  const supabase = await createClient();
  let query = supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId)
    .order("type", { ascending: true })
    .order("name", { ascending: true });

  if (type) query = query.eq("type", type);

  const { data, error } = await query;
  if (error) {
    console.error("getCategories:", error.message);
    return [];
  }
  return (data ?? []) as Category[];
}

export async function getCategoryById(id: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return (data as Category | null) ?? null;
}
