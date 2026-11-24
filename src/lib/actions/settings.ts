"use server";

import { getCurrentUser } from "@/lib/auth/dal";
import { revalidateFinance } from "@/lib/revalidate";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/types";
import { profileSchema, type ProfileInput } from "@/lib/validations";

export async function updateProfile(input: ProfileInput): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) return { success: false, message: "Sesi berakhir. Silakan masuk lagi." };

  const parsed = profileSchema.safeParse(input);
  if (!parsed.success) {
    return {
      success: false,
      message: "Data profil tidak valid.",
      errors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name?.trim() || null,
      currency: parsed.data.currency,
    })
    .eq("id", user.id);

  if (error) return { success: false, message: error.message };

  revalidateFinance();
  return { success: true, message: "Pengaturan berhasil disimpan." };
}
