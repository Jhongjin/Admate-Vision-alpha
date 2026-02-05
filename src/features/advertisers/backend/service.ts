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
import type { AdvertiserBulkResult } from '@/features/advertisers/backend/schema';
import {
  advertiserErrorCodes,
  type AdvertiserServiceError,
} from '@/features/advertisers/backend/error';

const TABLE = 'vision_ocr_advertisers';

/** 광고주명·검색어 중복 비교용 정규화 (한글/영문 동일 브랜드 검사) */
function normalizeForDuplicate(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.\-_]/g, '');
}

function isDuplicateName(
  newName: string,
  newSearchTerms: string[],
  existing: { name: string; search_terms: string[] | null }
): boolean {
  const nNew = normalizeForDuplicate(newName);
  const nNewTerms = newSearchTerms.map(normalizeForDuplicate).filter(Boolean);
  const nExistingName = normalizeForDuplicate(existing.name);
  const nExistingTerms = (existing.search_terms ?? []).map(
    normalizeForDuplicate
  ).filter(Boolean);

  if (nNew === nExistingName) return true;
  if (nNewTerms.includes(nExistingName) || nExistingTerms.includes(nNew))
    return true;
  if (nNewTerms.some((t) => nExistingTerms.includes(t))) return true;
  return false;
}

function rowToResponse(row: AdvertiserRow): AdvertiserResponse {
  const rawTerms = row.search_terms ?? [];
  const searchTerms =
    rawTerms.length > 0 ? rawTerms : [row.name.trim()].filter(Boolean);
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    contactName: row.contact_name,
    campaignManagerName: row.campaign_manager_name,
    campaignManagerEmail: row.campaign_manager_email,
    searchTerms,
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

  const name = parse.data.name.trim();
  const searchTerms = parse.data.searchTerms ?? [];

  const listResult = await listAdvertisers(client);
  if (!listResult.ok) {
    const err = listResult as { ok: false; error: { message: string } };
    return failure(500, advertiserErrorCodes.fetchError, err.error.message);
  }
  const existingList = listResult.data;
  const duplicate = existingList.some((row) =>
    isDuplicateName(name, searchTerms, {
      name: row.name,
      search_terms: row.searchTerms,
    })
  );
  if (duplicate) {
    return failure(
      409,
      advertiserErrorCodes.nameAlreadyExists,
      '이미 등록된 광고주입니다.'
    );
  }

  const contactName = parse.data.contactName?.trim();
  const insert = {
    name,
    email: parse.data.email.trim(),
    contact_name: contactName && contactName.length > 0 ? contactName : null,
    campaign_manager_name: parse.data.campaignManagerName.trim(),
    campaign_manager_email: parse.data.campaignManagerEmail.trim(),
    search_terms: searchTerms,
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

  if (parse.data.name !== undefined || parse.data.searchTerms !== undefined) {
    const currentResult = await getAdvertiserById(client, id);
    if (!currentResult.ok) return currentResult;
    const current = currentResult.data;
    const newName = (parse.data.name?.trim() ?? current.name).trim();
    const newTerms = parse.data.searchTerms ?? current.searchTerms ?? [];
    const listResult = await listAdvertisers(client);
    if (!listResult.ok) {
      const err = listResult as { ok: false; error: { message: string } };
      return failure(500, advertiserErrorCodes.fetchError, err.error.message);
    }
    const others = listResult.data.filter((row) => row.id !== id);
    const duplicate = others.some((row) =>
      isDuplicateName(newName, newTerms, {
        name: row.name,
        search_terms: row.searchTerms,
      })
    );
    if (duplicate) {
      return failure(
        409,
        advertiserErrorCodes.nameAlreadyExists,
        '이미 등록된 광고주입니다.'
      );
    }
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

function findDuplicateExisting(
  name: string,
  searchTerms: string[],
  list: AdvertiserResponse[]
): AdvertiserResponse | null {
  return (
    list.find((row) =>
      isDuplicateName(name, searchTerms, { name: row.name, search_terms: row.searchTerms })
    ) ?? null
  );
}

export async function createAdvertisersBulk(
  client: SupabaseClient,
  bodies: AdvertiserCreate[],
  onDuplicate: 'skip' | 'overwrite' = 'skip'
): Promise<HandlerResult<AdvertiserBulkResult, AdvertiserServiceError, unknown>> {
  const result: AdvertiserBulkResult = {
    created: 0,
    updated: 0,
    skipped: 0,
    errors: [],
  };

  const listResult = await listAdvertisers(client);
  if (!listResult.ok) {
    const err = listResult as { ok: false; error: { message: string } };
    return failure(500, advertiserErrorCodes.fetchError, err.error.message);
  }
  const existingList = listResult.data;
  const createdInBatch: { name: string; search_terms: string[] }[] = [];

  for (let i = 0; i < bodies.length; i++) {
    const body = bodies[i];
    const parse = AdvertiserCreateSchema.safeParse(body);
    if (!parse.success) {
      const msg = parse.error.errors.map((e) => e.message).join('; ') || '입력값이 올바르지 않습니다.';
      result.errors.push({ rowIndex: i + 1, message: msg });
      result.skipped++;
      continue;
    }

    const name = parse.data.name.trim();
    const searchTerms = (parse.data.searchTerms ?? []).map((s) => s.trim()).filter(Boolean);

    const dupExisting = findDuplicateExisting(name, searchTerms, existingList);
    const isDupInBatch = createdInBatch.some((row) =>
      isDuplicateName(name, searchTerms, { name: row.name, search_terms: row.search_terms })
    );

    if (dupExisting && onDuplicate === 'overwrite') {
      const updateResult = await updateAdvertiser(client, dupExisting.id, {
        name: parse.data.name,
        email: parse.data.email,
        contactName: parse.data.contactName,
        campaignManagerName: parse.data.campaignManagerName,
        campaignManagerEmail: parse.data.campaignManagerEmail,
        searchTerms: parse.data.searchTerms,
      });
      if (!updateResult.ok) {
        const err = updateResult as { ok: false; error: { message: string } };
        result.errors.push({ rowIndex: i + 1, message: err.error.message });
        result.skipped++;
        continue;
      }
      result.updated++;
      continue;
    }

    if (dupExisting || isDupInBatch) {
      result.errors.push({ rowIndex: i + 1, message: '이미 등록된 광고주입니다.' });
      result.skipped++;
      continue;
    }

    const contactName = parse.data.contactName?.trim();
    const insert = {
      name,
      email: parse.data.email.trim(),
      contact_name: contactName && contactName.length > 0 ? contactName : null,
      campaign_manager_name: parse.data.campaignManagerName.trim(),
      campaign_manager_email: parse.data.campaignManagerEmail.trim(),
      search_terms: searchTerms,
    };

    const { data, error } = await client
      .from(TABLE)
      .insert(insert)
      .select()
      .single<AdvertiserRow>();

    if (error) {
      result.errors.push({ rowIndex: i + 1, message: error.message });
      result.skipped++;
      continue;
    }

    const rowParse = AdvertiserRowSchema.safeParse(data);
    if (!rowParse.success) {
      result.errors.push({ rowIndex: i + 1, message: '저장 결과 검증 실패' });
      result.skipped++;
      continue;
    }

    createdInBatch.push({ name: rowParse.data.name, search_terms: rowParse.data.search_terms ?? [] });
    result.created++;
  }

  return success(result);
}
