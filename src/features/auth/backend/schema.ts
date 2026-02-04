import { z } from 'zod';

const emailSchema = z
  .string()
  .min(1, '이메일을 입력해 주세요.')
  .email('올바른 이메일 형식이 아닙니다.');

export const SignupBodySchema = z.object({
  name: z.string().min(1, '이름을 입력해 주세요.').max(100),
  email: emailSchema,
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
});

export type UserRow = z.infer<typeof UserRowSchema>;

export const UserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  createdAt: z.string(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
