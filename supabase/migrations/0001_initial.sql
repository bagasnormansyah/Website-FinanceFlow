-- Personal Finance Management System — initial schema
-- Jalankan file ini di Supabase SQL Editor (atau via Supabase CLI db push).

create extension if not exists pgcrypto;

do $$ begin
  create type public.transaction_type as enum ('income', 'expense');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.recurring_frequency as enum ('daily', 'weekly', 'monthly', 'yearly');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  currency text not null default 'IDR',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Categories
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  type public.transaction_type not null,
  color text not null default '#3b82f6',
  icon text not null default 'circle',
  is_default boolean not null default false,
  is_savings boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type, name)
);

create index if not exists categories_user_type_idx
  on public.categories (user_id, type);

-- ---------------------------------------------------------------------------
-- Transactions
-- ---------------------------------------------------------------------------
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  type public.transaction_type not null,
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  transaction_date date not null,
  notes text,
  source text not null default 'manual',
  recurring_rule_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists transactions_user_date_idx
  on public.transactions (user_id, transaction_date desc);
create index if not exists transactions_user_category_idx
  on public.transactions (user_id, category_id);
create index if not exists transactions_user_type_idx
  on public.transactions (user_id, type);

-- ---------------------------------------------------------------------------
-- Budgets (one budget per category per month; NULL category = overall budget)
-- ---------------------------------------------------------------------------
create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  month date not null,
  amount numeric(14, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_month_first_day check (month = date_trunc('month', month)::date)
);

create unique index if not exists budgets_user_month_category_key
  on public.budgets (
    user_id,
    month,
    coalesce(category_id, '00000000-0000-0000-0000-000000000000'::uuid)
  );

-- ---------------------------------------------------------------------------
-- Recurring rules
-- ---------------------------------------------------------------------------
create table if not exists public.recurring_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  amount numeric(14, 2) not null check (amount > 0),
  type public.transaction_type not null,
  frequency public.recurring_frequency not null,
  start_date date not null,
  end_date date,
  is_active boolean not null default true,
  last_generated_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_rules_date_range check (end_date is null or end_date >= start_date)
);

alter table public.transactions
  drop constraint if exists transactions_recurring_rule_fkey;
alter table public.transactions
  add constraint transactions_recurring_rule_fkey
  foreign key (recurring_rule_id) references public.recurring_rules(id) on delete set null;

create index if not exists recurring_rules_due_idx
  on public.recurring_rules (is_active, start_date, end_date);

-- ---------------------------------------------------------------------------
-- Recurring occurrences — guarantees one transaction per rule/date
-- ---------------------------------------------------------------------------
create table if not exists public.recurring_occurrences (
  id uuid primary key default gen_random_uuid(),
  rule_id uuid not null references public.recurring_rules(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  occurrence_date date not null,
  transaction_id uuid references public.transactions(id) on delete set null,
  status text not null default 'generated',
  created_at timestamptz not null default now(),
  unique (rule_id, occurrence_date)
);

create index if not exists recurring_occurrences_user_date_idx
  on public.recurring_occurrences (user_id, occurrence_date desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at_profiles on public.profiles;
create trigger set_updated_at_profiles before update on public.profiles
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_categories on public.categories;
create trigger set_updated_at_categories before update on public.categories
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_transactions on public.transactions;
create trigger set_updated_at_transactions before update on public.transactions
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_budgets on public.budgets;
create trigger set_updated_at_budgets before update on public.budgets
  for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at_recurring_rules on public.recurring_rules;
create trigger set_updated_at_recurring_rules before update on public.recurring_rules
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- New user: create profile + default categories
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;

  insert into public.categories (user_id, name, type, color, icon, is_default, is_savings) values
    (new.id, 'Salary',              'income',  '#22c55e', 'briefcase',       true, false),
    (new.id, 'Freelance',           'income',  '#14b8a6', 'laptop',          true, false),
    (new.id, 'Business',            'income',  '#0ea5e9', 'store',           true, false),
    (new.id, 'Affiliate',           'income',  '#6366f1', 'link',            true, false),
    (new.id, 'Investment',          'income',  '#a855f7', 'trending-up',     true, false),
    (new.id, 'Bonus',               'income',  '#f59e0b', 'gift',            true, false),
    (new.id, 'Other Income',        'income',  '#64748b', 'circle',          true, false),
    (new.id, 'Food & Beverage',     'expense', '#f97316', 'utensils',        true, false),
    (new.id, 'Transportation',      'expense', '#3b82f6', 'car',             true, false),
    (new.id, 'Housing',             'expense', '#8b5cf6', 'house',           true, false),
    (new.id, 'Electricity & Internet','expense','#06b6d4','wifi',            true, false),
    (new.id, 'Shopping',            'expense', '#ec4899', 'shopping-bag',    true, false),
    (new.id, 'Entertainment',       'expense', '#eab308', 'film',            true, false),
    (new.id, 'Education',           'expense', '#2563eb', 'graduation-cap',  true, false),
    (new.id, 'Health',              'expense', '#ef4444', 'heart-pulse',     true, false),
    (new.id, 'Family',              'expense', '#f43f5e', 'users',           true, false),
    (new.id, 'Savings',             'expense', '#eab308', 'piggy-bank',      true, true),
    (new.id, 'Subscription',        'expense', '#6366f1', 'repeat',          true, false),
    (new.id, 'Other Expenses',      'expense', '#64748b', 'circle',          true, false)
  on conflict (user_id, type, name) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill categories for users created before this migration.
insert into public.profiles (id, full_name)
select u.id, coalesce(u.raw_user_meta_data ->> 'full_name', split_part(u.email, '@', 1))
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_rules enable row level security;
alter table public.recurring_occurrences enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "categories_select_own" on public.categories;
create policy "categories_select_own" on public.categories
  for select using (auth.uid() = user_id);
drop policy if exists "categories_insert_own" on public.categories;
create policy "categories_insert_own" on public.categories
  for insert with check (auth.uid() = user_id);
drop policy if exists "categories_update_own" on public.categories;
create policy "categories_update_own" on public.categories
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "categories_delete_own" on public.categories;
create policy "categories_delete_own" on public.categories
  for delete using (auth.uid() = user_id and is_default = false);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own" on public.transactions
  for select using (auth.uid() = user_id);
drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own" on public.transactions
  for insert with check (auth.uid() = user_id);
drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own" on public.transactions
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own" on public.transactions
  for delete using (auth.uid() = user_id);

drop policy if exists "budgets_select_own" on public.budgets;
create policy "budgets_select_own" on public.budgets
  for select using (auth.uid() = user_id);
drop policy if exists "budgets_insert_own" on public.budgets;
create policy "budgets_insert_own" on public.budgets
  for insert with check (auth.uid() = user_id);
drop policy if exists "budgets_update_own" on public.budgets;
create policy "budgets_update_own" on public.budgets
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "budgets_delete_own" on public.budgets;
create policy "budgets_delete_own" on public.budgets
  for delete using (auth.uid() = user_id);

drop policy if exists "recurring_rules_select_own" on public.recurring_rules;
create policy "recurring_rules_select_own" on public.recurring_rules
  for select using (auth.uid() = user_id);
drop policy if exists "recurring_rules_insert_own" on public.recurring_rules;
create policy "recurring_rules_insert_own" on public.recurring_rules
  for insert with check (auth.uid() = user_id);
drop policy if exists "recurring_rules_update_own" on public.recurring_rules;
create policy "recurring_rules_update_own" on public.recurring_rules
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists "recurring_rules_delete_own" on public.recurring_rules;
create policy "recurring_rules_delete_own" on public.recurring_rules
  for delete using (auth.uid() = user_id);

drop policy if exists "recurring_occurrences_select_own" on public.recurring_occurrences;
create policy "recurring_occurrences_select_own" on public.recurring_occurrences
  for select using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Monthly report view (RLS applied to caller via security_invoker)
-- ---------------------------------------------------------------------------
create or replace view public.monthly_financials as
select
  t.user_id,
  date_trunc('month', t.transaction_date)::date as month,
  coalesce(sum(t.amount) filter (where t.type = 'income'), 0) as income,
  coalesce(sum(t.amount) filter (where t.type = 'expense' and coalesce(c.is_savings, false) = false), 0) as expense,
  coalesce(sum(t.amount) filter (where t.type = 'expense' and coalesce(c.is_savings, false) = true), 0) as savings,
  count(*)::integer as transaction_count
from public.transactions t
left join public.categories c on c.id = t.category_id
group by t.user_id, date_trunc('month', t.transaction_date)::date;

alter view public.monthly_financials set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- Atomic, idempotent recurring transaction generator (used by the cron job)
-- ---------------------------------------------------------------------------
create or replace function public.generate_recurring_transaction(
  p_rule_id uuid,
  p_occurrence_date date
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rule public.recurring_rules%rowtype;
  v_occurrence_id uuid;
  v_transaction_id uuid;
begin
  select * into v_rule
  from public.recurring_rules
  where id = p_rule_id
    and is_active = true
    and p_occurrence_date >= start_date
    and (end_date is null or p_occurrence_date <= end_date);

  if not found then
    return null;
  end if;

  insert into public.recurring_occurrences (rule_id, user_id, occurrence_date, status)
  values (p_rule_id, v_rule.user_id, p_occurrence_date, 'pending')
  on conflict (rule_id, occurrence_date) do nothing
  returning id into v_occurrence_id;

  -- Already generated for this date: never create a duplicate.
  if v_occurrence_id is null then
    return null;
  end if;

  insert into public.transactions (
    user_id, category_id, type, name, amount, transaction_date, notes, source, recurring_rule_id
  )
  values (
    v_rule.user_id, v_rule.category_id, v_rule.type, v_rule.name, v_rule.amount,
    p_occurrence_date, 'Dibuat otomatis dari transaksi berulang', 'recurring', v_rule.id
  )
  returning id into v_transaction_id;

  update public.recurring_occurrences
  set transaction_id = v_transaction_id, status = 'generated'
  where id = v_occurrence_id;

  return v_transaction_id;
end;
$$;

revoke all on function public.generate_recurring_transaction(uuid, date) from public;
grant execute on function public.generate_recurring_transaction(uuid, date) to service_role;

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$ begin
  alter publication supabase_realtime add table public.transactions;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.budgets;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.recurring_rules;
exception when duplicate_object then null; end $$;
