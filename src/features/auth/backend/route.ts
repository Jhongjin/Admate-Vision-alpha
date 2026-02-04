import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  SignupBodySchema,
  LoginBodySchema,
  MeQuerySchema,
} from '@/features/auth/backend/schema';
import { signup, login, getMeByEmail } from '@/features/auth/backend/service';
import {
  authErrorCodes,
  type AuthServiceError,
} from '@/features/auth/backend/error';

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
    const supabase = getSupabase(c);
    const result = await signup(supabase, parsed.data);
    if (!result.ok) {
      const err = result as ErrorResult<AuthServiceError, unknown>;
      getLogger(c).error('Auth signup failed', err.error.message);
      return respond(c, result);
    }
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
    const supabase = getSupabase(c);
    const result = await getMeByEmail(supabase, parsed.data.email);
    if (!result.ok) {
      const err = result as ErrorResult<AuthServiceError, unknown>;
      getLogger(c).error('Auth me failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });
};
