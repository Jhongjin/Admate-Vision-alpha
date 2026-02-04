import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  AdvertiserCreateSchema,
  AdvertiserResponseSchema,
  AdvertiserRowSchema,
  AdvertiserUpdateSchema,
  type AdvertiserCreate,
  type AdvertiserResponse,
  type AdvertiserRow,
  type AdvertiserUpdate,
} from '@/features/advertisers/backend/schema';
import {
  advertiserErrorCodes,
  type AdvertiserServiceError,
} from '@/features/advertisers/backend/error';

const TABLE = 'vision_ocr_advertisers';

function rowToResponse(row: AdvertiserRow): AdvertiserResponse {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    contactName: row.contact_name,
    campaignManagerName: row.campaign_manager_name,
    campaignManagerEmail: row.campaign_manager_email,
    searchTerms: row.search_terms ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listAdvertisers(
  client: SupabaseClient
): Promise<HandlerResult<AdvertiserResponse[], AdvertiserServiceError, unknown>> {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    return failure(500, advertiserErrorCodes.fetchError, error.message);
  }

  const rows = (data ?? []) as AdvertiserRow[];
  const results: AdvertiserResponse[] = [];
  for (const r of rows) {
    const rowParse = AdvertiserRowSchema.safeParse(r);
    if (!rowParse.success) continue;
    const resp = rowToResponse(rowParse.data);
    const respParse = AdvertiserResponseSchema.safeParse(resp);
    if (respParse.success) results.push(respParse.data);
  }
  return success(results);
}

export async function getAdvertiserById(
  client: SupabaseClient,
  id: string
): Promise<HandlerResult<AdvertiserResponse, AdvertiserServiceError, unknown>> {
  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('id', id)
    .maybeSingle<AdvertiserRow>();

  if (error) {
    return failure(500, advertiserErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, advertiserErrorCodes.notFound, '광고주를 찾을 수 없습니다.');
  }

  const rowParse = AdvertiserRowSchema.safeParse(data);
  if (!rowParse.success) {
    return failure(
      500,
      advertiserErrorCodes.validationError,
      'Row validation failed.',
      rowParse.error.format()
    );
  }

  const response = rowToResponse(rowParse.data);
  const responseParse = AdvertiserResponseSchema.safeParse(response);
  if (!responseParse.success) {
    return failure(
      500,
      advertiserErrorCodes.validationError,
      'Response validation failed.',
      responseParse.error.format()
    );
  }

  return success(responseParse.data);
}

export async function createAdvertiser(
  client: SupabaseClient,
  body: AdvertiserCreate
): Promise<HandlerResult<AdvertiserResponse, AdvertiserServiceError, unknown>> {
  const parse = AdvertiserCreateSchema.safeParse(body);
  if (!parse.success) {
    return failure(
      400,
      advertiserErrorCodes.validationError,
      '입력값이 올바르지 않습니다.',
      parse.error.format()
    );
  }

  const contactName = parse.data.contactName?.trim();
  const insert = {
    name: parse.data.name.trim(),
    email: parse.data.email.trim(),
    contact_name: contactName && contactName.length > 0 ? contactName : null,
    campaign_manager_name: parse.data.campaignManagerName.trim(),
    campaign_manager_email: parse.data.campaignManagerEmail.trim(),
    search_terms: parse.data.searchTerms ?? [],
  };

  const { data, error } = await client
    .from(TABLE)
    .insert(insert)
    .select()
    .single<AdvertiserRow>();

  if (error) {
    return failure(500, advertiserErrorCodes.createError, error.message);
  }

  const rowParse = AdvertiserRowSchema.safeParse(data);
  if (!rowParse.success) {
    return failure(
      500,
      advertiserErrorCodes.validationError,
      'Created row validation failed.',
      rowParse.error.format()
    );
  }

  return success(rowToResponse(rowParse.data));
}

export async function updateAdvertiser(
  client: SupabaseClient,
  id: string,
  body: AdvertiserUpdate
): Promise<HandlerResult<AdvertiserResponse, AdvertiserServiceError, unknown>> {
  const parse = AdvertiserUpdateSchema.safeParse(body);
  if (!parse.success) {
    return failure(
      400,
      advertiserErrorCodes.validationError,
      '입력값이 올바르지 않습니다.',
      parse.error.format()
    );
  }

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (parse.data.name !== undefined) updates.name = parse.data.name.trim();
  if (parse.data.email !== undefined) updates.email = parse.data.email.trim();
  if (parse.data.contactName !== undefined) {
    const v = parse.data.contactName?.trim();
    updates.contact_name = v && v.length > 0 ? v : null;
  }
  if (parse.data.campaignManagerName !== undefined)
    updates.campaign_manager_name = parse.data.campaignManagerName.trim();
  if (parse.data.campaignManagerEmail !== undefined)
    updates.campaign_manager_email = parse.data.campaignManagerEmail.trim();
  if (parse.data.searchTerms !== undefined)
    updates.search_terms = parse.data.searchTerms;

  const { data, error } = await client
    .from(TABLE)
    .update(updates)
    .eq('id', id)
    .select()
    .single<AdvertiserRow>();

  if (error) {
    return failure(500, advertiserErrorCodes.updateError, error.message);
  }

  if (!data) {
    return failure(404, advertiserErrorCodes.notFound, '광고주를 찾을 수 없습니다.');
  }

  const rowParse = AdvertiserRowSchema.safeParse(data);
  if (!rowParse.success) {
    return failure(
      500,
      advertiserErrorCodes.validationError,
      'Updated row validation failed.',
      rowParse.error.format()
    );
  }

  return success(rowToResponse(rowParse.data));
}

export async function deleteAdvertiser(
  client: SupabaseClient,
  id: string
): Promise<HandlerResult<{ deleted: true }, AdvertiserServiceError, unknown>> {
  const { error, count } = await client
    .from(TABLE)
    .delete({ count: 'exact' })
    .eq('id', id);

  if (error) {
    return failure(500, advertiserErrorCodes.deleteError, error.message);
  }

  if (count === 0) {
    return failure(404, advertiserErrorCodes.notFound, '광고주를 찾을 수 없습니다.');
  }

  return success({ deleted: true });
}
