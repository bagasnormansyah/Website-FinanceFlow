import "server-only";

import { revalidatePath } from "next/cache";

const FINANCE_PATHS = [
  "/dashboard",
  "/income",
  "/expense",
  "/transactions",
  "/categories",
  "/budgets",
  "/reports",
  "/recurring",
  "/settings",
];

export function revalidateFinance() {
  for (const path of FINANCE_PATHS) {
    revalidatePath(path);
  }
}
