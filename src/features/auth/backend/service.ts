import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  SignupBodySchema,
  LoginBodySchema,
  UserRowSchema,
  UserResponseSchema,
  type SignupBody,
  type LoginBody,
  type UserRow,
  type UserResponse,
} from '@/features/auth/backend/schema';
import {
  authErrorCodes,
  type AuthServiceError,
} from '@/features/auth/backend/error';

const TABLE = 'users';

function rowToResponse(row: UserRow): UserResponse {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    createdAt: row.created_at,
  };
}

export async function signup(
  client: SupabaseClient,
  body: SignupBody
): Promise<HandlerResult<UserResponse, AuthServiceError, unknown>> {
  const parse = SignupBodySchema.safeParse(body);
  if (!parse.success) {
    return failure(
      400,
      authErrorCodes.validationError,
      '입력값이 올바르지 않습니다.',
      parse.error.format()
    );
  }

  const { name, email } = parse.data;
  const trimmedName = name.trim();
  const trimmedEmail = email.trim().toLowerCase();

  const { data: existing } = await client
    .from(TABLE)
    .select('id')
    .eq('email', trimmedEmail)
    .maybeSingle();

  if (existing) {
    return failure(
      409,
      authErrorCodes.emailAlreadyExists,
      '이미 등록된 이메일입니다.'
    );
  }

  const { data, error } = await client
    .from(TABLE)
    .insert({
      name: trimmedName,
      email: trimmedEmail,
      email_verified: true,
    })
    .select()
    .single<UserRow>();

  if (error) {
    return failure(500, authErrorCodes.createError, error.message);
  }

  const rowParse = UserRowSchema.safeParse(data);
  if (!rowParse.success) {
    return failure(
      500,
      authErrorCodes.validationError,
      '저장 결과 검증 실패.',
      rowParse.error.format()
    );
  }

  const response = rowToResponse(rowParse.data);
  const responseParse = UserResponseSchema.safeParse(response);
  if (!responseParse.success) {
    return failure(
      500,
      authErrorCodes.validationError,
      '응답 검증 실패.',
      responseParse.error.format()
    );
  }

  return success(responseParse.data);
}

export async function login(
  client: SupabaseClient,
  body: LoginBody
): Promise<HandlerResult<UserResponse, AuthServiceError, unknown>> {
  const parse = LoginBodySchema.safeParse(body);
  if (!parse.success) {
    return failure(
      400,
      authErrorCodes.validationError,
      '이메일을 입력해 주세요.',
      parse.error.format()
    );
  }

  const trimmedEmail = parse.data.email.trim().toLowerCase();

  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('email', trimmedEmail)
    .maybeSingle<UserRow>();

  if (error) {
    return failure(500, authErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(
      404,
      authErrorCodes.notFound,
      '등록된 이메일이 없습니다. 회원가입 후 이용해 주세요.'
    );
  }

  const rowParse = UserRowSchema.safeParse(data);
  if (!rowParse.success) {
    return failure(
      500,
      authErrorCodes.validationError,
      '조회 결과 검증 실패.',
      rowParse.error.format()
    );
  }

  const row = rowParse.data;
  if (!row.email_verified) {
    return failure(
      403,
      authErrorCodes.emailNotVerified,
      '이메일 인증을 완료한 뒤 로그인해 주세요. 가입한 이메일로 발송된 인증 링크를 확인해 주세요.'
    );
  }

  return success(rowToResponse(row));
}

export async function getMeByEmail(
  client: SupabaseClient,
  email: string
): Promise<HandlerResult<UserResponse, AuthServiceError, unknown>> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return failure(
      400,
      authErrorCodes.validationError,
      '이메일이 필요합니다.'
    );
  }

  const { data, error } = await client
    .from(TABLE)
    .select('*')
    .eq('email', trimmed)
    .maybeSingle<UserRow>();

  if (error) {
    return failure(500, authErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(404, authErrorCodes.notFound, '사용자를 찾을 수 없습니다.');
  }

  const rowParse = UserRowSchema.safeParse(data);
  if (!rowParse.success) {
    return failure(
      500,
      authErrorCodes.validationError,
      '조회 결과 검증 실패.',
      rowParse.error.format()
    );
  }

  return success(rowToResponse(rowParse.data));
}

export async function verifyEmail(
  client: SupabaseClient,
  token: string
): Promise<HandlerResult<{ email: string }, AuthServiceError, unknown>> {
  const trimmed = token.trim();
  if (!trimmed) {
    return failure(
      400,
      authErrorCodes.validationError,
      '인증 링크가 올바르지 않습니다.'
    );
  }

  const now = new Date().toISOString();
  const { data, error } = await client
    .from(TABLE)
    .select('id, email')
    .eq('email_verification_token', trimmed)
    .gt('email_verification_expires_at', now)
    .maybeSingle<{ id: string; email: string }>();

  if (error) {
    return failure(500, authErrorCodes.fetchError, error.message);
  }

  if (!data) {
    return failure(
      400,
      authErrorCodes.verificationTokenInvalid,
      '인증 링크가 만료되었거나 올바르지 않습니다. 다시 회원가입하거나 인증 메일을 재발송해 주세요.'
    );
  }

  const { error: updateError } = await client
    .from(TABLE)
    .update({
      email_verified: true,
      email_verification_token: null,
      email_verification_expires_at: null,
    })
    .eq('id', data.id);

  if (updateError) {
    return failure(500, authErrorCodes.createError, updateError.message);
  }

  return success({ email: data.email });
}

export async function withdrawByEmail(
  client: SupabaseClient,
  email: string
): Promise<HandlerResult<{ ok: true }, AuthServiceError, unknown>> {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return failure(
      400,
      authErrorCodes.validationError,
      '이메일이 필요합니다.'
    );
  }

  const { data: existing } = await client
    .from(TABLE)
    .select('id')
    .eq('email', trimmed)
    .maybeSingle();

  if (!existing) {
    return failure(
      404,
      authErrorCodes.notFound,
      '등록된 이메일이 없습니다.'
    );
  }

  const { error } = await client
    .from(TABLE)
    .delete()
    .eq('id', existing.id);

  if (error) {
    return failure(500, authErrorCodes.createError, error.message);
  }

  return success({ ok: true });
}
