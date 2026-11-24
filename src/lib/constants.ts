import type { RecurringFrequency, TransactionType } from "@/lib/types";

export const INCOME_CATEGORIES = [
  { name: "Salary", color: "#22c55e", icon: "briefcase" },
  { name: "Freelance", color: "#14b8a6", icon: "laptop" },
  { name: "Business", color: "#0ea5e9", icon: "store" },
  { name: "Affiliate", color: "#6366f1", icon: "link" },
  { name: "Investment", color: "#a855f7", icon: "trending-up" },
  { name: "Bonus", color: "#f59e0b", icon: "gift" },
  { name: "Other Income", color: "#64748b", icon: "circle" },
] as const;

export const EXPENSE_CATEGORIES = [
  { name: "Food & Beverage", color: "#f97316", icon: "utensils" },
  { name: "Transportation", color: "#3b82f6", icon: "car" },
  { name: "Housing", color: "#8b5cf6", icon: "house" },
  { name: "Electricity & Internet", color: "#06b6d4", icon: "wifi" },
  { name: "Shopping", color: "#ec4899", icon: "shopping-bag" },
  { name: "Entertainment", color: "#eab308", icon: "film" },
  { name: "Education", color: "#2563eb", icon: "graduation-cap" },
  { name: "Health", color: "#ef4444", icon: "heart-pulse" },
  { name: "Family", color: "#f43f5e", icon: "users" },
  { name: "Savings", color: "#eab308", icon: "piggy-bank", isSavings: true },
  { name: "Subscription", color: "#6366f1", icon: "repeat" },
  { name: "Other Expenses", color: "#64748b", icon: "circle" },
] as const;

export const TRANSACTION_TYPES: { value: TransactionType; label: string }[] = [
  { value: "income", label: "Pemasukan" },
  { value: "expense", label: "Pengeluaran" },
];

export const FREQUENCIES: { value: RecurringFrequency; label: string }[] = [
  { value: "daily", label: "Harian" },
  { value: "weekly", label: "Mingguan" },
  { value: "monthly", label: "Bulanan" },
  { value: "yearly", label: "Tahunan" },
];

export const CURRENCIES = ["IDR", "USD", "SGD", "EUR", "JPY"] as const;

export const CHART_COLORS = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#ec4899",
  "#06b6d4",
  "#f97316",
  "#6366f1",
];

export const PAGE_SIZE = 10;
