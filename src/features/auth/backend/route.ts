import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, getConfig, type AppEnv } from '@/backend/hono/context';
import { isSupabasePlaceholder } from '@/backend/config';
import {
  SignupBodySchema,
  LoginBodySchema,
  MeQuerySchema,
  VerifyEmailQuerySchema,
  WithdrawBodySchema,
} from '@/features/auth/backend/schema';
import { signup, login, getMeByEmail, verifyEmail, withdrawByEmail } from '@/features/auth/backend/service';
import {
  authErrorCodes,
  type AuthServiceError,
} from '@/features/auth/backend/error';

const SERVICE_UNAVAILABLE_MESSAGE =
  '로그인·회원가입을 사용하려면 Supabase 환경 변수(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)를 Vercel 프로젝트에 설정한 뒤 재배포해 주세요.';

export const registerAuthRoutes = (app: Hono<AppEnv>) => {
  app.post('/auth/signup', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = SignupBodySchema.safeParse(body);
    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          '이름과 이메일을 입력해 주세요.',
          parsed.error.format()
        )
      );
    }
    if (isSupabasePlaceholder(getConfig(c))) {
      return respond(
        c,
        failure(503, authErrorCodes.serviceUnavailable, SERVICE_UNAVAILABLE_MESSAGE)
      );
    }
    const supabase = getSupabase(c);
    const result = await signup(supabase, parsed.data);
    if (!result.ok) {
      const err = result as ErrorResult<AuthServiceError, unknown>;
      getLogger(c).error('Auth signup failed', err.error.message);
      return respond(c, result);
    }
    getLogger(c).info('Auth signup success', parsed.data.email);
    return respond(c, result);
  });

  app.post('/auth/login', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = LoginBodySchema.safeParse(body);
    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          '이메일을 입력해 주세요.',
          parsed.error.format()
        )
      );
    }
    if (isSupabasePlaceholder(getConfig(c))) {
      return respond(
        c,
        failure(503, authErrorCodes.serviceUnavailable, SERVICE_UNAVAILABLE_MESSAGE)
      );
    }
    const supabase = getSupabase(c);
    const result = await login(supabase, parsed.data);
    if (!result.ok) {
      const err = result as ErrorResult<AuthServiceError, unknown>;
      getLogger(c).error('Auth login failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });

  app.get('/auth/me', async (c) => {
    const email = c.req.query('email');
    const parsed = MeQuerySchema.safeParse({ email: email ?? '' });
    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          '이메일이 필요합니다.',
          parsed.error.format()
        )
      );
    }
    if (isSupabasePlaceholder(getConfig(c))) {
      return respond(
        c,
        failure(503, authErrorCodes.serviceUnavailable, SERVICE_UNAVAILABLE_MESSAGE)
      );
    }
    const supabase = getSupabase(c);
    const result = await getMeByEmail(supabase, parsed.data.email);
    if (!result.ok) {
      const err = result as ErrorResult<AuthServiceError, unknown>;
      getLogger(c).error('Auth me failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });

  app.get('/auth/verify-email', async (c) => {
    const token = c.req.query('token');
    const parsed = VerifyEmailQuerySchema.safeParse({ token: token ?? '' });
    if (!parsed.success) {
      return c.redirect('/login?error=invalid_token', 302);
    }
    if (isSupabasePlaceholder(getConfig(c))) {
      return c.redirect('/login?error=service_unavailable', 302);
    }
    const supabase = getSupabase(c);
    const result = await verifyEmail(supabase, parsed.data.token);
    if (!result.ok) {
      const err = result as ErrorResult<AuthServiceError, unknown>;
      getLogger(c).warn('Auth verify-email failed', err.error.message);
      return c.redirect('/login?error=verification_failed', 302);
    }
    return c.redirect('/login?verified=1', 302);
  });

  app.post('/auth/withdraw', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = WithdrawBodySchema.safeParse(body);
    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          authErrorCodes.validationError,
          '이메일을 입력해 주세요.',
          parsed.error.format()
        )
      );
    }
    if (isSupabasePlaceholder(getConfig(c))) {
      return respond(
        c,
        failure(503, authErrorCodes.serviceUnavailable, SERVICE_UNAVAILABLE_MESSAGE)
      );
    }
    const supabase = getSupabase(c);
    const result = await withdrawByEmail(supabase, parsed.data.email);
    if (!result.ok) {
      const err = result as ErrorResult<AuthServiceError, unknown>;
      getLogger(c).warn('Auth withdraw failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });
};
