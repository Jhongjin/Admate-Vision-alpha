-- 이메일 인증: 가입 후 인증 메일 링크 클릭 시 로그인 가능
alter table public.users
  add column if not exists email_verified boolean not null default false,
  add column if not exists email_verification_token text,
  add column if not exists email_verification_expires_at timestamptz;

comment on column public.users.email_verified is '이메일 인증 완료 여부';
comment on column public.users.email_verification_token is '이메일 인증용 토큰 (인증 후 null)';
comment on column public.users.email_verification_expires_at is '인증 토큰 만료 시각';

create index if not exists users_email_verification_token_idx on public.users (email_verification_token)
  where email_verification_token is not null;

-- 기존 가입자는 인증 완료로 간주
update public.users set email_verified = true where email_verification_token is null;
