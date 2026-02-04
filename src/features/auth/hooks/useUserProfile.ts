"use client";

import { useQuery } from "@tanstack/react-query";
import { getMeApi } from "@/features/auth/api";
import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";

export const userProfileQueryKey = (email: string) =>
  ["auth", "me", email] as const;

export function useUserProfile() {
  const { email, mounted } = useRegisteredEmail();
  const query = useQuery({
    queryKey: userProfileQueryKey(email ?? ""),
    queryFn: () => getMeApi(email!),
    enabled: mounted && Boolean(email),
    staleTime: 5 * 60 * 1000,
  });

  return {
    profile: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}
