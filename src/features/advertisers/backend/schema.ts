import { z } from 'zod';

const trimString = (s: string) => s.trim();
const emailSchema = z
  .string()
  .transform(trimString)
  .pipe(z.string().min(1, '이메일을 입력해 주세요.').email('올바른 이메일 형식이 아닙니다.'));

export const AdvertiserCreateSchema = z.object({
  name: z.string().transform(trimString).pipe(z.string().min(1, '광고주명을 입력해 주세요.')),
  email: emailSchema,
  contactName: z
    .string()
    .optional()
    .transform((s) => (s == null ? undefined : s.trim() || undefined)),
  campaignManagerName: z.string().transform(trimString).pipe(z.string().min(1, '캠페인 담당자 이름을 입력해 주세요.')),
  campaignManagerEmail: emailSchema,
  searchTerms: z
    .array(z.string().transform(trimString).pipe(z.string()))
    .default([])
    .transform((arr) => arr.filter(Boolean)),
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

const BULK_MAX = 100;

export const AdvertiserBulkCreateSchema = z.object({
  advertisers: z
    .array(AdvertiserCreateSchema)
    .min(1, '최소 1건의 광고주를 입력해 주세요.')
    .max(BULK_MAX, `한 번에 최대 ${BULK_MAX}건까지 등록할 수 있습니다.`),
  /** 중복 시 건너뛰기(skip) | 덮어쓰기(overwrite) */
  onDuplicate: z.enum(['skip', 'overwrite']).default('skip'),
});

export type AdvertiserBulkCreate = z.infer<typeof AdvertiserBulkCreateSchema>;

export type AdvertiserBulkResult = {
  created: number;
  updated: number;
  skipped: number;
  errors: { rowIndex: number; message: string }[];
};
