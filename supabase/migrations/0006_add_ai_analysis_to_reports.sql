alter table public.vision_ocr_reports
add column if not exists ai_analysis jsonb;

comment on column public.vision_ocr_reports.ai_analysis is 'AI 분석 결과 JSON';
