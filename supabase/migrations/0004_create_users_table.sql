-- Admate-Vision: 앱 사용자 (회원가입: 이름 + 이메일만)
-- Vision-OCR / Vision-DA 공통 사용
create extension if not exists "pgcrypto";

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

comment on table public.users is 'Admate-Vision 앱 사용자. 회원가입 시 이름·이메일만 저장.';
comment on column public.users.name is '이름';
comment on column public.users.email is '이메일 (로그인 식별자)';

create unique index if not exists users_email_key on public.users (email);
create index if not exists users_created_at_idx on public.users (created_at desc);

alter table public.users disable row level security;
