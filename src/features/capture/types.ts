import type { AdCaptureItem } from "./constants";

/** 하나의 역사 방문 데이터 */
export type StationVisit = {
  /** 고유 식별자 */
  visitId: string;

  /** 위치(역명) 사진 1장 */
  locationImage?: string;
  /** 위치 촬영 시각 */
  locationCapturedAt?: string;

  /** 위치 없이 촬영한 경우 */
  skipLocation?: boolean;

  /** 광고물 사진 목록 (최대 10장/역) */
  adImages: AdCaptureItem[];

  /** GPS 좌표 */
  lat?: number;
  lng?: number;
  accuracy?: number;

  /** OCR로 인식된 역명 */
  stationName?: string;
  /** OCR로 인식된 호선 */
  subwayLine?: string;

  /** 인식된 광고주 */
  recognizedAdvertiser?: {
    id: string;
    name: string;
  };
};
