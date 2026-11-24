import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getCronSecret } from "@/lib/env";
import { getDueOccurrences } from "@/lib/recurring";
import { createAdminClient } from "@/lib/supabase/admin";
import { todayISO } from "@/lib/format";
import type { RecurringRule } from "@/lib/types";

export async function GET(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${getCronSecret()}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayISO();

  const { data: rules, error } = await supabase
    .from("recurring_rules")
    .select("*")
    .eq("is_active", true)
    .lte("start_date", today)
    .or(`end_date.is.null,end_date.gte.${today}`);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  let generated = 0;
  let failed = 0;
  const details: { ruleId: string; date: string; error?: string }[] = [];

  for (const rule of (rules ?? []) as RecurringRule[]) {
    const dates = getDueOccurrences(rule, today);
    let lastSuccessful: string | null = null;

    for (const date of dates) {
      const { error: rpcError } = await supabase.rpc("generate_recurring_transaction", {
        p_rule_id: rule.id,
        p_occurrence_date: date,
      });

      if (rpcError) {
        failed += 1;
        details.push({ ruleId: rule.id, date, error: rpcError.message });
      } else {
        generated += 1;
        lastSuccessful = date;
      }
    }

    const checkpoint = lastSuccessful ?? dates.at(-1);
    if (checkpoint) {
      await supabase
        .from("recurring_rules")
        .update({ last_generated_date: checkpoint })
        .eq("id", rule.id);
    }
  }

  return NextResponse.json({
    ok: true,
    date: today,
    rulesProcessed: rules?.length ?? 0,
    generated,
    failed,
    details: details.slice(0, 50),
  });
}
