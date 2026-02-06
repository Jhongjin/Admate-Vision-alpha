import { match } from "ts-pattern";

/** 쿠키에 저장하는 사용자 이메일 키 (회원가입 없이 이메일만 등록) */
export const REGISTERED_EMAIL_COOKIE_NAME = "admate_user_email";
/** localStorage 백업 키 (스마트폰 등에서 쿠키가 사라져도 복원용) */
export const REGISTERED_EMAIL_STORAGE_KEY = "admate_user_email";

const PUBLIC_PATHS = ["/", "/login", "/signup"] as const;
const PUBLIC_PREFIXES = ["/_next", "/api", "/favicon", "/static", "/docs", "/images", "/reports/analysis"] as const;

export const LOGIN_PATH = "/login";
export const SIGNUP_PATH = "/signup";
export const AUTH_ENTRY_PATHS = [LOGIN_PATH, SIGNUP_PATH] as const;
export const isAuthEntryPath = (
  pathname: string
): pathname is (typeof AUTH_ENTRY_PATHS)[number] =>
  AUTH_ENTRY_PATHS.includes(pathname as (typeof AUTH_ENTRY_PATHS)[number]);

export const isAuthPublicPath = (pathname: string) => {
  const normalized = pathname.toLowerCase();

  return match(normalized)
    .when(
      (path) => PUBLIC_PATHS.some((publicPath) => publicPath === path),
      () => true
    )
    .when(
      (path) => PUBLIC_PREFIXES.some((prefix) => path.startsWith(prefix)),
      () => true
    )
    .otherwise(() => false);
};

export const shouldProtectPath = (pathname: string) => !isAuthPublicPath(pathname);
