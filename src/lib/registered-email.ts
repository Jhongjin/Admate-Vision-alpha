"use client";

import { REGISTERED_EMAIL_COOKIE_NAME } from "@/constants/auth";

const COOKIE_MAX_AGE_YEAR = 60 * 60 * 24 * 365;

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAge}; SameSite=Lax`;
}

export function getRegisteredEmail(): string | null {
  return getCookie(REGISTERED_EMAIL_COOKIE_NAME);
}

export function setRegisteredEmail(email: string): void {
  setCookie(REGISTERED_EMAIL_COOKIE_NAME, email.trim(), COOKIE_MAX_AGE_YEAR);
}

export function clearRegisteredEmail(): void {
  setCookie(REGISTERED_EMAIL_COOKIE_NAME, "", 0);
}
