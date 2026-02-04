-- Admate-Vision: Vision-OCR(옥외 광고 게재) + Vision-DA(디지털 온라인 광고 배너 캡처)
-- 한 Supabase 프로젝트에서 두 하위 프로젝트를 테이블 prefix로 구분 (vision_ocr_*, vision_da_*)

create extension if not exists "pgcrypto";

-- =============================================================================
-- Vision-OCR: 옥외 광고 게재 현황 자동 보고
-- =============================================================================

-- 광고주 정보 (OCR 매칭·캠페인 담당자 연락용)
create table if not exists public.vision_ocr_advertisers (
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

comment on table public.vision_ocr_advertisers is 'Vision-OCR: 광고주 정보. OCR 매칭 및 캠페인 담당자 연락용.';
comment on column public.vision_ocr_advertisers.name is '광고주명';
comment on column public.vision_ocr_advertisers.email is '광고주 이메일';
comment on column public.vision_ocr_advertisers.contact_name is '광고주 담당자 이름 (옵션)';
comment on column public.vision_ocr_advertisers.campaign_manager_name is '캠페인 담당자 이름';
comment on column public.vision_ocr_advertisers.campaign_manager_email is '캠페인 담당자 이메일';
comment on column public.vision_ocr_advertisers.search_terms is 'OCR 매칭용 검색어 목록';

create index if not exists vision_ocr_advertisers_email_idx on public.vision_ocr_advertisers (email);
create index if not exists vision_ocr_advertisers_updated_at_idx on public.vision_ocr_advertisers (updated_at desc);

-- 촬영 기록 (옥외 광고 촬영·위치·인식 결과)
create table if not exists public.vision_ocr_captures (
  id uuid primary key default gen_random_uuid(),
  image_storage_path text,
  lat double precision,
  lng double precision,
  address_label text,
  advertiser_id uuid references public.vision_ocr_advertisers(id) on delete set null,
  ocr_text text,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.vision_ocr_captures is 'Vision-OCR: 옥외 광고 촬영 기록. 이미지·위치·광고주 매칭 결과.';
comment on column public.vision_ocr_captures.image_storage_path is '저장소 이미지 경로 (Supabase Storage 등)';
comment on column public.vision_ocr_captures.advertiser_id is '매칭된 광고주 (FK)';
comment on column public.vision_ocr_captures.ocr_text is 'OCR 추출 텍스트';

create index if not exists vision_ocr_captures_captured_at_idx on public.vision_ocr_captures (captured_at desc);
create index if not exists vision_ocr_captures_advertiser_id_idx on public.vision_ocr_captures (advertiser_id);

-- =============================================================================
-- Vision-DA: 디지털 온라인 광고 배너 캡처
-- =============================================================================

-- 캠페인/광고주 (디지털 배너용)
create table if not exists public.vision_da_campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.vision_da_campaigns is 'Vision-DA: 디지털 광고 캠페인/광고주.';
comment on column public.vision_da_campaigns.name is '캠페인/광고주명';
comment on column public.vision_da_campaigns.description is '설명 (옵션)';

create index if not exists vision_da_campaigns_updated_at_idx on public.vision_da_campaigns (updated_at desc);

-- 배너 캡처 기록
create table if not exists public.vision_da_captures (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references public.vision_da_campaigns(id) on delete set null,
  screenshot_storage_path text,
  source_url text,
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.vision_da_captures is 'Vision-DA: 디지털 배너 캡처 기록.';
comment on column public.vision_da_captures.screenshot_storage_path is '스크린샷 저장 경로';
comment on column public.vision_da_captures.source_url is '캡처 시점 URL';

create index if not exists vision_da_captures_captured_at_idx on public.vision_da_captures (captured_at desc);
create index if not exists vision_da_captures_campaign_id_idx on public.vision_da_captures (campaign_id);

-- =============================================================================
-- RLS (필요 시 활성화)
-- =============================================================================
alter table public.vision_ocr_advertisers disable row level security;
alter table public.vision_ocr_captures disable row level security;
alter table public.vision_da_campaigns disable row level security;
alter table public.vision_da_captures disable row level security;

-- =============================================================================
-- 기존 public.advertisers 사용 중이었다면 데이터 이전 후 제거 (수동 실행 권장)
-- INSERT INTO public.vision_ocr_advertisers (id, name, email, contact_name, campaign_manager_name, campaign_manager_email, search_terms, created_at, updated_at)
-- SELECT id, name, email, contact_name, campaign_manager_name, campaign_manager_email, search_terms, created_at, updated_at FROM public.advertisers;
-- DROP TABLE IF EXISTS public.advertisers;
-- =============================================================================
