import "server-only";

import { createClient } from "@/lib/supabase/server";
import { PAGE_SIZE } from "@/lib/constants";
import type { Transaction, TransactionFilters } from "@/lib/types";

const SELECT = "*, categories(id, name, color, icon, is_savings)";

function normalize(item: Record<string, unknown>): Transaction {
  return { ...item, amount: Number(item.amount) } as Transaction;
}

export async function getFilteredTransactions(
  userId: string,
  filters: TransactionFilters = {},
): Promise<{ data: Transaction[]; count: number }> {
  const supabase = await createClient();
  const {
    page = 1,
    pageSize = PAGE_SIZE,
    search,
    type,
    categoryId,
    from,
    to,
    sort = "transaction_date",
    order = "desc",
  } = filters;

  let query = supabase
    .from("transactions")
    .select(SELECT, { count: "exact" })
    .eq("user_id", userId);

  if (search) query = query.ilike("name", `%${search}%`);
  if (type && type !== "all") query = query.eq("type", type);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);

  const { data, count, error } = await query
    .order(sort, { ascending: order === "asc" })
    .range((page - 1) * pageSize, page * pageSize - 1);

  if (error) {
    console.error("getFilteredTransactions:", error.message);
    return { data: [], count: 0 };
  }

  return { data: (data ?? []).map(normalize), count: count ?? 0 };
}

export async function getAllTransactionsForExport(
  userId: string,
  filters: TransactionFilters = {},
): Promise<Transaction[]> {
  const supabase = await createClient();
  const { search, type, categoryId, from, to, sort = "transaction_date", order = "desc" } = filters;

  let query = supabase.from("transactions").select(SELECT).eq("user_id", userId);
  if (search) query = query.ilike("name", `%${search}%`);
  if (type && type !== "all") query = query.eq("type", type);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (from) query = query.gte("transaction_date", from);
  if (to) query = query.lte("transaction_date", to);

  const { data, error } = await query.order(sort, { ascending: order === "asc" }).limit(10000);
  if (error) {
    console.error("getAllTransactionsForExport:", error.message);
    return [];
  }
  return (data ?? []).map(normalize);
}

export async function getAllTransactionsUntil(userId: string, endDate: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(SELECT)
    .eq("user_id", userId)
    .lte("transaction_date", endDate)
    .order("transaction_date", { ascending: true })
    .limit(20000);

  if (error) {
    console.error("getAllTransactionsUntil:", error.message);
    return [];
  }
  return (data ?? []).map(normalize);
}

export async function getRecentTransactions(userId: string, limit = 5) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("transactions")
    .select(SELECT)
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("getRecentTransactions:", error.message);
    return [];
  }
  return (data ?? []).map(normalize);
}

export async function getTransactionById(id: string, userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("transactions")
    .select(SELECT)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  return data ? normalize(data) : null;
}
