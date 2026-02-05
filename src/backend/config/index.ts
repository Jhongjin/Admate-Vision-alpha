import { z } from "zod";
import type { AppConfig } from "@/backend/hono/context";

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
});

export const PLACEHOLDER_SUPABASE_URL = "https://placeholder.supabase.co";

const PLACEHOLDER_CONFIG: AppConfig = {
  supabase: {
    url: PLACEHOLDER_SUPABASE_URL,
    serviceRoleKey: "placeholder-service-role-key",
  },
};

export function isSupabasePlaceholder(config: AppConfig): boolean {
  return config.supabase.url === PLACEHOLDER_SUPABASE_URL;
}

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.safeParse({
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  });

  if (parsed.success) {
    cachedConfig = {
      supabase: {
        url: parsed.data.SUPABASE_URL,
        serviceRoleKey: parsed.data.SUPABASE_SERVICE_ROLE_KEY,
      },
    } satisfies AppConfig;
    return cachedConfig;
  }

  console.warn(
    "Backend: SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 없음. placeholder 사용. Supabase API 호출은 동작하지 않습니다."
  );
  return PLACEHOLDER_CONFIG;
};
