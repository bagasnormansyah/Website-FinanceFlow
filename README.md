# FinanceFlow — Personal Finance Management System

Aplikasi manajemen keuangan pribadi berbasis Next.js 16 + Supabase. Semua angka di dashboard, laporan, dan grafik dihitung langsung dari database—bukan data statis.

## Fitur utama

- Autentikasi Supabase (register, login, logout, callback OTP/verifikasi).
- Dashboard dengan 4 kartu ringkasan, 5 grafik Recharts, transaksi terbaru, dan ringkasan anggaran.
- CRUD pemasukan & pengeluaran dengan kategori bawaan dan kategori custom.
- Manajemen transaksi: pencarian, filter tanggal/kategori/jenis, sorting, pagination, edit, hapus, dan export CSV.
- Sistem laporan bulanan: navigasi bulan, perbandingan bulan sebelumnya, rekap tahunan, dan riwayat 12 bulan.
- Anggaran bulanan per kategori atau keseluruhan dengan progress bar dan peringatan limit.
- Transaksi berulang harian/mingguan/bulanan/tahunan dengan scheduler cron dan proteksi duplikat.
- Dark/light mode, sidebar responsif, toast, tooltip, dan realtime refresh via Supabase Realtime.
- RLS Supabase pada semua tabel; data pengguna terisolasi secara otomatis.

## Stack

Next.js 16 (App Router), TypeScript, Tailwind CSS 4, shadcn/ui (preset Nova + Radix), Lucide React, Recharts, Supabase (Postgres/Auth/Realtime), Zod, React Hook Form, dan Sonner.

## Menjalankan secara lokal

1. Install dependency:

   ```bash
   npm install
   ```

2. Salin template environment:

   ```bash
   cp .env.example .env.local
   ```

3. Isi variabel berikut di `.env.local`:

   - `NEXT_PUBLIC_SUPABASE_URL` — Project URL Supabase.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon/public key.
   - `SUPABASE_SERVICE_ROLE_KEY` — Service role key (hanya dipakai cron, jangan diekspos ke client).
   - `CRON_SECRET` — Secret acak untuk melindungi endpoint cron.
   - `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` — Secret acak untuk Server Actions.

4. Jalankan SQL migration:

   Buka Supabase Dashboard → SQL Editor → jalankan seluruh isi [`supabase/migrations/0001_initial.sql`](supabase/migrations/0001_initial.sql).

   Migration ini membuat tabel `profiles`, `categories`, `transactions`, `budgets`, `recurring_rules`, `recurring_occurrences`, view `monthly_financials`, RLS policies, trigger kategori default untuk user baru, realtime publication, dan fungsi atomik `generate_recurring_transaction()`.

5. Konfigurasi Supabase Auth:

   - Aktifkan provider Email di Authentication → Providers.
   - Tambahkan `http://localhost:3000/auth/callback` pada Authentication → URL Configuration → Redirect URLs.
   - Untuk produksi, ganti localhost dengan domain deployment Anda.

6. Jalankan aplikasi:

   ```bash
   npm run dev
   ```

   Buka `http://localhost:3000`; Anda akan diarahkan ke `/login`.

## Transaksi berulang / cron

Endpoint: `GET /api/cron/recurring`, dilindungi dengan:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" https://DOMAIN_ANDA/api/cron/recurring
```

Pada Vercel, [`vercel.json`](vercel.json) sudah menjadwalkan endpoint ini setiap hari pukul 00:00 UTC. Untuk platform lain, gunakan cron job/server scheduler yang setara.

Idempotensi dijamin oleh constraint unik `(rule_id, occurrence_date)` pada `recurring_occurrences` dan fungsi Postgres `generate_recurring_transaction()` dengan `INSERT ... ON CONFLICT DO NOTHING`. Menjalankan cron dua kali tidak akan membuat transaksi ganda untuk tanggal yang sama.

## Model data penting

- `transactions` adalah sumber kebenaran untuk seluruh perhitungan.
- `transaction_date` (bukan `created_at`) menentukan bulan laporan.
- Tabungan dimodelkan sebagai kategori expense dengan flag `is_savings = true`. Saldo = pemasukan − pengeluaran − tabungan, sehingga tabungan tampil terpisah dari pengeluaran.
- Anggaran unik per `(user_id, month, category_id)`; `category_id = NULL` berarti anggaran keseluruhan.

## Script

```bash
npm run dev     # development server
npm run build   # production build
npm run start   # production server
npm run lint    # ESLint
```

## Status verifikasi

Build produksi dan lint sudah diuji dengan environment dummy. Koneksi CRUD/realtime langsung belum dapat diuji karena kredensial Supabase belum diisi. Isi `.env.local` dan jalankan migration terlebih dahulu sebelum menguji fitur secara end-to-end.
