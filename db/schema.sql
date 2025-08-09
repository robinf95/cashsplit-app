create extension if not exists pgcrypto;
create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  currency text not null default 'EUR',
  members text[] not null default '{}',
  created_at timestamptz not null default now()
);
create table if not exists expenses (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  group_id uuid not null references groups(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  payer text not null,
  for_members text[] not null,
  note text,
  date timestamptz not null default now(),
  currency text,
  archived boolean not null default false
);
create table if not exists user_settings (
  user_id text primary key,
  exchange_rates jsonb default '{}',
  base_currency text default 'EUR',
  updated_at timestamptz not null default now()
);
