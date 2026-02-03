import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

const _clientEnv = clientEnvSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

const DEV_PLACEHOLDERS: ClientEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://placeholder.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "placeholder-anon-key",
};

function getEnv(): ClientEnv {
  if (_clientEnv.success) return _clientEnv.data;
  console.warn(
    "환경 변수 검증 실패: Supabase 설정이 없어 placeholder를 사용합니다. 이메일 등록·카메라 등은 동작하며, Supabase 연동만 비활성화됩니다."
  );
  return DEV_PLACEHOLDERS;
}

export const env = getEnv();
