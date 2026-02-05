export const authErrorCodes = {
  notFound: 'AUTH_USER_NOT_FOUND',
  fetchError: 'AUTH_FETCH_ERROR',
  createError: 'AUTH_CREATE_ERROR',
  validationError: 'AUTH_VALIDATION_ERROR',
  emailAlreadyExists: 'AUTH_EMAIL_ALREADY_EXISTS',
  serviceUnavailable: 'AUTH_SERVICE_UNAVAILABLE',
} as const;

type AuthErrorValue = (typeof authErrorCodes)[keyof typeof authErrorCodes];

export type AuthServiceError = AuthErrorValue;
