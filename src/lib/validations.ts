import { z } from "zod";

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal tidak valid.")
  .refine((value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()), {
    message: "Tanggal tidak valid.",
  });

const monthKey = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Format bulan tidak valid.");

export const transactionSchema = z.object({
  name: z.string().trim().min(1, "Nama transaksi wajib diisi.").max(120),
  amount: z.number({ error: "Nominal harus berupa angka." }).positive("Nominal harus lebih dari 0."),
  type: z.enum(["income", "expense"]),
  category_id: z.string().uuid().nullable().optional(),
  transaction_date: isoDate,
  notes: z.string().trim().max(500).optional().nullable(),
});

export type TransactionInput = z.infer<typeof transactionSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, "Nama kategori wajib diisi.").max(60),
  type: z.enum(["income", "expense"]),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Pilih warna yang valid."),
  icon: z.string().trim().min(1).max(40),
  is_savings: z.boolean(),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const budgetSchema = z.object({
  category_id: z.string().uuid().nullable().optional(),
  month: monthKey,
  amount: z.number({ error: "Nominal harus berupa angka." }).nonnegative("Nominal anggaran tidak boleh negatif."),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

export const recurringRuleSchema = z
  .object({
    name: z.string().trim().min(1, "Nama transaksi wajib diisi.").max(120),
    amount: z.number({ error: "Nominal harus berupa angka." }).positive("Nominal harus lebih dari 0."),
    type: z.enum(["income", "expense"]),
    category_id: z.string().uuid().nullable().optional(),
    frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
    start_date: isoDate,
    end_date: isoDate.nullable().optional(),
    is_active: z.boolean(),
  })
  .refine(
    (value) =>
      !value.end_date || value.end_date >= value.start_date,
    { message: "Tanggal akhir tidak boleh sebelum tanggal mulai.", path: ["end_date"] },
  );

export type RecurringRuleInput = z.infer<typeof recurringRuleSchema>;

export const profileSchema = z.object({
  full_name: z.string().trim().max(100).optional().nullable(),
  currency: z.enum(["IDR", "USD", "SGD", "EUR", "JPY"]),
});

export type ProfileInput = z.infer<typeof profileSchema>;

export const loginSchema = z.object({
  email: z.email("Email tidak valid."),
  password: z.string().min(6, "Password minimal 6 karakter."),
});

export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2, "Nama minimal 2 karakter.").max(100),
    email: z.email("Email tidak valid."),
    password: z.string().min(8, "Password minimal 8 karakter."),
    confirmPassword: z.string().min(1, "Konfirmasi password wajib diisi."),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Password tidak sama.",
    path: ["confirmPassword"],
  });
