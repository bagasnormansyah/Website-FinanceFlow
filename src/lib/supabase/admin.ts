import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { getServiceRoleKey, supabaseUrl } from "@/lib/env";

export function createAdminClient() {
  return createSupabaseClient(supabaseUrl, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
