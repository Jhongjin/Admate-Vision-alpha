-- Vision-OCR: 보고 발송 이력 (이메일 발송 성공 시 기록)
create table if not exists public.vision_ocr_reports (
  id uuid primary key default gen_random_uuid(),
  advertiser_id uuid references public.vision_ocr_advertisers(id) on delete set null,
  advertiser_name text not null,
  station text,
  line text,
  location_label text,
  image_count int,
  sent_at timestamptz not null default now(),
  sent_to_email text,
  created_at timestamptz not null default now()
);

comment on table public.vision_ocr_reports is 'Vision-OCR: 보고 메일 발송 이력.';
comment on column public.vision_ocr_reports.advertiser_id is '광고주 ID (FK)';
comment on column public.vision_ocr_reports.advertiser_name is '광고주명';
comment on column public.vision_ocr_reports.station is '역명';
comment on column public.vision_ocr_reports.line is '호선';
comment on column public.vision_ocr_reports.location_label is '위치/사용자입력 정보';
comment on column public.vision_ocr_reports.image_count is '첨부 이미지 수';
comment on column public.vision_ocr_reports.sent_at is '발송 시각';
comment on column public.vision_ocr_reports.sent_to_email is '수신 이메일(주 수신자)';

create index if not exists vision_ocr_reports_sent_at_idx on public.vision_ocr_reports (sent_at desc);
create index if not exists vision_ocr_reports_advertiser_id_idx on public.vision_ocr_reports (advertiser_id);

alter table public.vision_ocr_reports disable row level security;
