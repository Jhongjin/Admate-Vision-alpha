-- Add image_urls column to vision_ocr_reports
alter table public.vision_ocr_reports
add column if not exists image_urls text[];

comment on column public.vision_ocr_reports.image_urls is '첨부된 현장 촬영 이미지 URL 목록';

-- Create a storage bucket for report images if not exists
insert into storage.buckets (id, name, public)
values ('report-images', 'report-images', true)
on conflict (id) do nothing;

-- Allow public read access to the bucket
create policy "Public Access"
on storage.objects for select
using ( bucket_id = 'report-images' );

-- Allow authenticated users (service role will bypass RLS anyway, but good to have) to insert
create policy "Authenticated Insert"
on storage.objects for insert
with check ( bucket_id = 'report-images' );
