"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import {
  fetchAdvertisers,
  fetchAdvertiserById,
  createAdvertiser,
  updateAdvertiser,
  deleteAdvertiser,
  extractApiErrorMessage,
} from "@/features/advertisers/api";
import type {
  AdvertiserCreate,
  AdvertiserUpdate,
} from "@/features/advertisers/backend/schema";

export const advertisersQueryKey = ["advertisers"] as const;
export const advertiserQueryKey = (id: string) =>
  ["advertisers", id] as const;

export function useAdvertisers() {
  return useQuery({
    queryKey: advertisersQueryKey,
    queryFn: fetchAdvertisers,
    staleTime: 60 * 1000,
  });
}

export function useAdvertiser(id: string | null) {
  return useQuery({
    queryKey: advertiserQueryKey(id ?? ""),
    queryFn: () => fetchAdvertiserById(id!),
    enabled: Boolean(id),
    staleTime: 60 * 1000,
  });
}

export function useCreateAdvertiser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdvertiserCreate) => createAdvertiser(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advertisersQueryKey });
    },
  });
}

export function useUpdateAdvertiser(id: string | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: AdvertiserUpdate) =>
      updateAdvertiser(id!, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advertisersQueryKey });
      if (id) {
        queryClient.invalidateQueries({ queryKey: advertiserQueryKey(id) });
      }
    },
  });
}

export function useDeleteAdvertiser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteAdvertiser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: advertisersQueryKey });
    },
  });
}

export { extractApiErrorMessage };
