import type { Hono } from 'hono';
import {
  failure,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import { getLogger, getSupabase, type AppEnv } from '@/backend/hono/context';
import {
  AdvertiserParamsSchema,
  AdvertiserCreateSchema,
  AdvertiserUpdateSchema,
  AdvertiserBulkCreateSchema,
} from '@/features/advertisers/backend/schema';
import {
  listAdvertisers,
  getAdvertiserById,
  createAdvertiser,
  updateAdvertiser,
  deleteAdvertiser,
  createAdvertisersBulk,
} from '@/features/advertisers/backend/service';
import {
  advertiserErrorCodes,
  type AdvertiserServiceError,
} from '@/features/advertisers/backend/error';

export const registerAdvertiserRoutes = (app: Hono<AppEnv>) => {
  app.get('/advertisers', async (c) => {
    const supabase = getSupabase(c);
    const result = await listAdvertisers(supabase);
    if (!result.ok) {
      const err = result as ErrorResult<AdvertiserServiceError, unknown>;
      getLogger(c).error('Advertisers list failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });

  app.get('/advertisers/:id', async (c) => {
    const parsed = AdvertiserParamsSchema.safeParse({
      id: c.req.param('id'),
    });
    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          advertiserErrorCodes.validationError,
          '유효한 ID가 아닙니다.',
          parsed.error.format()
        )
      );
    }
    const supabase = getSupabase(c);
    const result = await getAdvertiserById(supabase, parsed.data.id);
    if (!result.ok) {
      const err = result as ErrorResult<AdvertiserServiceError, unknown>;
      getLogger(c).error('Advertiser get failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });

  app.post('/advertisers', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = AdvertiserCreateSchema.safeParse(body);
    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          advertiserErrorCodes.validationError,
          '입력값이 올바르지 않습니다.',
          parsed.error.format()
        )
      );
    }
    const supabase = getSupabase(c);
    const result = await createAdvertiser(supabase, parsed.data);
    if (!result.ok) {
      const err = result as ErrorResult<AdvertiserServiceError, unknown>;
      getLogger(c).error('Advertiser create failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });

  app.post('/advertisers/bulk', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = AdvertiserBulkCreateSchema.safeParse(body);
    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          advertiserErrorCodes.validationError,
          '벌크 입력값이 올바르지 않습니다.',
          parsed.error.format()
        )
      );
    }
    const supabase = getSupabase(c);
    const result = await createAdvertisersBulk(
      supabase,
      parsed.data.advertisers,
      parsed.data.onDuplicate
    );
    if (!result.ok) {
      const err = result as ErrorResult<AdvertiserServiceError, unknown>;
      getLogger(c).error('Advertisers bulk create failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });

  app.patch('/advertisers/:id', async (c) => {
    const paramParse = AdvertiserParamsSchema.safeParse({
      id: c.req.param('id'),
    });
    if (!paramParse.success) {
      return respond(
        c,
        failure(
          400,
          advertiserErrorCodes.validationError,
          '유효한 ID가 아닙니다.',
          paramParse.error.format()
        )
      );
    }
    const body = await c.req.json().catch(() => ({}));
    const bodyParse = AdvertiserUpdateSchema.safeParse(body);
    if (!bodyParse.success) {
      return respond(
        c,
        failure(
          400,
          advertiserErrorCodes.validationError,
          '입력값이 올바르지 않습니다.',
          bodyParse.error.format()
        )
      );
    }
    const supabase = getSupabase(c);
    const result = await updateAdvertiser(
      supabase,
      paramParse.data.id,
      bodyParse.data
    );
    if (!result.ok) {
      const err = result as ErrorResult<AdvertiserServiceError, unknown>;
      getLogger(c).error('Advertiser update failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });

  app.delete('/advertisers/:id', async (c) => {
    const parsed = AdvertiserParamsSchema.safeParse({
      id: c.req.param('id'),
    });
    if (!parsed.success) {
      return respond(
        c,
        failure(
          400,
          advertiserErrorCodes.validationError,
          '유효한 ID가 아닙니다.',
          parsed.error.format()
        )
      );
    }
    const supabase = getSupabase(c);
    const result = await deleteAdvertiser(supabase, parsed.data.id);
    if (!result.ok) {
      const err = result as ErrorResult<AdvertiserServiceError, unknown>;
      getLogger(c).error('Advertiser delete failed', err.error.message);
      return respond(c, result);
    }
    return respond(c, result);
  });
};
