export const advertiserErrorCodes = {
  notFound: 'ADVERTISER_NOT_FOUND',
  fetchError: 'ADVERTISER_FETCH_ERROR',
  createError: 'ADVERTISER_CREATE_ERROR',
  updateError: 'ADVERTISER_UPDATE_ERROR',
  deleteError: 'ADVERTISER_DELETE_ERROR',
  validationError: 'ADVERTISER_VALIDATION_ERROR',
} as const;

type AdvertiserErrorValue =
  (typeof advertiserErrorCodes)[keyof typeof advertiserErrorCodes];

export type AdvertiserServiceError = AdvertiserErrorValue;
