"use client";

import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import type { Advertiser } from "@/features/advertisers/types";
import type {
  AdvertiserCreate,
  AdvertiserUpdate,
} from "@/features/advertisers/backend/schema";

const BASE = "/api/advertisers";

export async function fetchAdvertisers(): Promise<Advertiser[]> {
  const { data } = await apiClient.get<Advertiser[]>(BASE);
  return data;
}

export async function fetchAdvertiserById(id: string): Promise<Advertiser> {
  const { data } = await apiClient.get<Advertiser>(`${BASE}/${id}`);
  return data;
}

export async function createAdvertiser(
  body: AdvertiserCreate
): Promise<Advertiser> {
  const { data } = await apiClient.post<Advertiser>(BASE, body);
  return data;
}

export async function updateAdvertiser(
  id: string,
  body: AdvertiserUpdate
): Promise<Advertiser> {
  const { data } = await apiClient.patch<Advertiser>(`${BASE}/${id}`, body);
  return data;
}

export async function deleteAdvertiser(id: string): Promise<void> {
  await apiClient.delete(`${BASE}/${id}`);
}

export { extractApiErrorMessage };
