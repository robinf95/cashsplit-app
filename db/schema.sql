create extension if not exists pgcrypto;
create table if not exists groups (
  id uuid primary key,
  user_id text not null,
  name text not null,
  currency text not null default 'EUR',
  created_at timestamptz not null default now()
);
create table if not exists expenses (
  id uuid primary key,
  user_id text not null,
  group_id uuid not null references groups(id) on delete cascade,
  amount numeric(12,2) not null check (amount >= 0),
  payer text not null,
  for_members text[] not null,
  note text,
  date timestamptz not null default now(),
  currency text
);