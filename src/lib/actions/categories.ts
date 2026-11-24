"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { revalidateFinance } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { categorySchema, type CategoryInput } from "@/lib/validations";

export async function createCategory(input: CategoryInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data kategori tidak valid.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    ...parsed.data,
    is_default: false,
  });

  if (error) {
    return { success: false, message: "Kategori dengan nama tersebut sudah ada." };
  }

  revalidateFinance();
  return { success: true, message: "Kategori berhasil ditambahkan." };
}

export async function updateCategory(id: string, input: CategoryInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, message: "Data kategori tidak valid.", errors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update(parsed.data)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: "Gagal memperbarui kategori." };

  revalidateFinance();
  return { success: true, message: "Kategori berhasil diperbarui." };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const supabase = await createClient();
  const { data: category } = await supabase
    .from("categories")
    .select("is_default")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!category) return { success: false, message: "Kategori tidak ditemukan." };
  if (category.is_default) {
    return { success: false, message: "Kategori bawaan tidak dapat dihapus." };
  }

  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Kategori berhasil dihapus." };
}
