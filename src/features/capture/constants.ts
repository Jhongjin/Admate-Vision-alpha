/** sessionStorage 키: 촬영 직후 확인 페이지로 전달하는 데이터 */
export const CAPTURE_SESSION_KEY = "admate_capture_data";

/** 이 장수 이상이면 저장 용량 주의 안내 (sessionStorage ~5MB 한계 고려) */
export const SESSION_STORAGE_WARN_IMAGE_COUNT = 8;

/** 광고 사진 1장 (위치 촬영 후 추가 촬영) */
export type AdCaptureItem = {
  imageDataUrl: string;
  capturedAt: string;
};

/**
 * 촬영 세션 데이터.
 * - 단일 촬영(레거시): imageDataUrl만 있으면 1장 촬영 → 확인
 * - 위치+광고 세션: locationImage(지하철 역명) + adImages(광고물 N장) → 확인에서 파일명 생성
 * - 위치 없음+광고 세션: skipLocation true + adImages → 역명/호선 없이 확인
 */
export type CaptureSessionData = {
  /** 단일 촬영 시 사용 (레거시) */
  imageDataUrl?: string;
  /** 위치(지하철 역명) 촬영 1장 - 첫 번째 사진 */
  locationImage?: string;
  /** 위치 촬영 시각 */
  locationCapturedAt?: string;
  /** 위치 없이 광고만 촬영한 경우 true */
  skipLocation?: boolean;
  /** 광고물 사진 목록 (최대 10장) */
  adImages?: AdCaptureItem[];
  lat?: number;
  lng?: number;
  accuracy?: number;
  /** 단일 촬영 시각 (레거시) */
  capturedAt?: string;
};

/** 세션에 광고물 목록이 있고 (위치 사진 있음 또는 위치 없음 모드) 확인 페이지용인지 */
export function isLocationAdSession(
  data: CaptureSessionData
): data is CaptureSessionData & { adImages: AdCaptureItem[] } {
  return (
    Array.isArray(data.adImages) &&
    data.adImages.length > 0 &&
    (Boolean(data.locationImage) || data.skipLocation === true)
  );
}
