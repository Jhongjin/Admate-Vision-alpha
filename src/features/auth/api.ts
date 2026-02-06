"use client";

import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { UserResponse } from "@/features/auth/backend/schema";
import type { SignupBody, LoginBody, WithdrawBody } from "@/features/auth/backend/schema";

export async function signupApi(body: SignupBody): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>("/api/auth/signup", body);
  return data;
}

export async function loginApi(body: LoginBody): Promise<UserResponse> {
  const { data } = await apiClient.post<UserResponse>("/api/auth/login", body);
  return data;
}

export async function getMeApi(email: string): Promise<UserResponse> {
  const { data } = await apiClient.get<UserResponse>(
    `/api/auth/me?email=${encodeURIComponent(email)}`
  );
  return data;
}

export async function withdrawApi(body: WithdrawBody): Promise<{ ok: true }> {
  const { data } = await apiClient.post<{ ok: true }>("/api/auth/withdraw", body);
  return data;
}

export { extractApiErrorMessage };
