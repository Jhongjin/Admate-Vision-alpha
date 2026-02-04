-- Migration: create advertisers table for 광고주 정보 (CRUD)
create extension if not exists "pgcrypto";

create table if not exists public.advertisers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  contact_name text,
  campaign_manager_name text not null,
  campaign_manager_email text not null,
  search_terms text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.advertisers is '광고주 정보. OCR 매칭 및 캠페인 담당자 연락용.';
comment on column public.advertisers.name is '광고주명';
comment on column public.advertisers.email is '광고주 이메일';
comment on column public.advertisers.contact_name is '광고주 담당자 이름 (옵션)';
comment on column public.advertisers.campaign_manager_name is '캠페인 담당자 이름';
comment on column public.advertisers.campaign_manager_email is '캠페인 담당자 이메일';
comment on column public.advertisers.search_terms is 'OCR 매칭용 검색어 목록';

create index if not exists advertisers_email_idx on public.advertisers (email);
create index if not exists advertisers_updated_at_idx on public.advertisers (updated_at desc);

alter table public.advertisers disable row level security;
