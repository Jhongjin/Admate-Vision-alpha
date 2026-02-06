import { z } from 'zod';

const SIGNUP_EMAIL_DOMAIN = '@nasmedia.co.kr';

const emailSchema = z
  .string()
  .min(1, '이메일을 입력해 주세요.')
  .email('올바른 이메일 형식이 아닙니다.');

/** 회원가입 시 이메일은 @nasmedia.co.kr 도메인만 허용 */
const signupEmailSchema = emailSchema.refine(
  (v) => v.trim().toLowerCase().endsWith(SIGNUP_EMAIL_DOMAIN),
  { message: `회원가입은 ${SIGNUP_EMAIL_DOMAIN} 이메일만 가능합니다.` }
);

export const SignupBodySchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(100),
  email: signupEmailSchema,
});

export const LoginBodySchema = z.object({
  email: emailSchema,
});

export const MeQuerySchema = z.object({
  email: z.string().min(1, '이메일이 필요합니다.'),
});

export type SignupBody = z.infer<typeof SignupBodySchema>;
export type LoginBody = z.infer<typeof LoginBodySchema>;
export type MeQuery = z.infer<typeof MeQuerySchema>;

export const UserRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  created_at: z.string(),
  email_verified: z.boolean().optional().default(false),
  email_verification_token: z.string().nullable().optional(),
  email_verification_expires_at: z.string().nullable().optional(),
});

export type UserRow = z.infer<typeof UserRowSchema>;

export const VerifyEmailQuerySchema = z.object({
  token: z.string().min(1, '인증 토큰이 필요합니다.'),
});

export type VerifyEmailQuery = z.infer<typeof VerifyEmailQuerySchema>;

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
