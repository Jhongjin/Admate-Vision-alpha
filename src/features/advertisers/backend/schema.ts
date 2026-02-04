import { z } from 'zod';

const emailSchema = z.string().min(1, '이메일을 입력해 주세요.').email('올바른 이메일 형식이 아닙니다.');

export const AdvertiserCreateSchema = z.object({
  name: z.string().min(1, '광고주명을 입력해 주세요.'),
  email: emailSchema,
  contactName: z.string().optional(),
  campaignManagerName: z.string().min(1, '캠페인 담당자 이름을 입력해 주세요.'),
  campaignManagerEmail: emailSchema,
  searchTerms: z.array(z.string()).default([]),
});

export const AdvertiserUpdateSchema = AdvertiserCreateSchema.partial();

export const AdvertiserParamsSchema = z.object({
  id: z.string().uuid('유효한 ID가 아닙니다.'),
});

export const AdvertiserRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  contact_name: z.string().nullable(),
  campaign_manager_name: z.string(),
  campaign_manager_email: z.string(),
  search_terms: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AdvertiserCreate = z.infer<typeof AdvertiserCreateSchema>;
export type AdvertiserUpdate = z.infer<typeof AdvertiserUpdateSchema>;
export type AdvertiserRow = z.infer<typeof AdvertiserRowSchema>;

export const AdvertiserResponseSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string(),
  contactName: z.string().nullable(),
  campaignManagerName: z.string(),
  campaignManagerEmail: z.string(),
  searchTerms: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AdvertiserResponse = z.infer<typeof AdvertiserResponseSchema>;
