"use client";

import {
  REGISTERED_EMAIL_COOKIE_NAME,
  REGISTERED_EMAIL_STORAGE_KEY,
} from "@/constants/auth";

const COOKIE_MAX_AGE_YEAR = 60 * 60 * 24 * 365;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

/** Session cookie: no max-age, removed when browser/tab closes */
function setCookieSession(name: string, value: string): void {
  if (typeof document === "undefined") return;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; SameSite=Lax${secure}`;
}

function getFromStorage(): string | null {
  if (typeof localStorage === "undefined") return null;
  try {
    return localStorage.getItem(REGISTERED_EMAIL_STORAGE_KEY);
  } catch {
    return null;
  }
}

function setStorage(value: string): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.setItem(REGISTERED_EMAIL_STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
}

function clearStorage(): void {
  if (typeof localStorage === "undefined") return;
  try {
    localStorage.removeItem(REGISTERED_EMAIL_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getRegisteredEmail(): string | null {
  const fromCookie = getCookie(REGISTERED_EMAIL_COOKIE_NAME);
  if (fromCookie) return fromCookie;
  const fromStorage = getFromStorage();
  if (fromStorage) {
    setCookie(REGISTERED_EMAIL_COOKIE_NAME, fromStorage, COOKIE_MAX_AGE_YEAR);
    return fromStorage;
  }
  return null;
}

export type SetRegisteredEmailOptions = {
  /** false = session only (로그인 상태 유지 해제 시). Default true */
  keepLoggedIn?: boolean;
};

export function setRegisteredEmail(
  email: string,
  options?: SetRegisteredEmailOptions
): void {
  const trimmed = email.trim();
  const keepLoggedIn = options?.keepLoggedIn !== false;
  if (keepLoggedIn) {
    setCookie(REGISTERED_EMAIL_COOKIE_NAME, trimmed, COOKIE_MAX_AGE_YEAR);
    setStorage(trimmed);
  } else {
    setCookieSession(REGISTERED_EMAIL_COOKIE_NAME, trimmed);
    // Do not write to localStorage so next visit requires login
  }
}

export function clearRegisteredEmail(): void {
  setCookie(REGISTERED_EMAIL_COOKIE_NAME, "", 0);
  clearStorage();
}
