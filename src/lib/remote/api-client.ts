import axios, { isAxiosError } from "axios";

/**
 * Same-origin API 클라이언트.
 *
 * - baseURL을 비워 두고, 호출 시 항상 `/api/...` 절대 경로를 사용합니다.
 * - 이렇게 하면 Vercel 등에서 `NEXT_PUBLIC_API_BASE_URL` 설정으로 인해
 *   `/api/api/...` 형태의 중복 경로가 생겨 404가 나는 문제를 방지할 수 있습니다.
 */
const apiClient = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

type ErrorPayload = {
  error?: {
    message?: string;
  };
  message?: string;
};

export const extractApiErrorMessage = (
  error: unknown,
  fallbackMessage = "API request failed."
) => {
  if (isAxiosError(error)) {
    const payload = error.response?.data as ErrorPayload | undefined;

    if (typeof payload?.error?.message === "string") {
      return payload.error.message;
    }

    if (typeof payload?.message === "string") {
      return payload.message;
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
};

export { apiClient, isAxiosError };
