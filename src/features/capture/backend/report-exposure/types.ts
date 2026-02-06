/**
 * 노출량 분석·PPT 보고용 타입.
 * Phase 2: 유동인구 데이터, Phase 3: 노출량 결과, Phase 4: PPT 생성 입력.
 */

/** 시간대별 유동인구(승하차 합 또는 일평균) */
export type TimeBandFlow = {
  /** 시간대 라벨 (예: "07-09", "09-12") */
  band: string;
  /** 해당 시간대 일평균 유동인구 */
  flow: number;
};

/** 역·호선별 유동인구 데이터 (공공 API 또는 캐시) */
export type StationFlowData = {
  stationName: string;
  lineName: string;
  /** 일평균 총 유동인구 (전 시간대 합) */
  dailyTotal: number;
  /** 시간대별 유동인구 (선택) */
  timeBands?: TimeBandFlow[];
  /** 데이터 기준일 (YYYY-MM-DD) */
  dataDate?: string;
};

/** 노출량 계산 입력 */
export type ExposureInput = {
  /** 유동인구 데이터 */
  flowData: StationFlowData;
  /** 게재 기간(일수) */
  displayDays: number;
  /** 가중치 (선택, 기본 1) */
  weight?: number;
};

/** 노출량 계산 결과 */
export type ExposureResult = {
  /** 예상 총 노출량 (유동인구 × 일수 × 가중치) */
  totalExposure: number;
  /** 일평균 유동인구 */
  dailyFlow: number;
  /** 게재 일수 */
  displayDays: number;
  /** 시간대별 기여 (선택) */
  byTimeBand?: { band: string; exposure: number }[];
};

/** PPT 생성 입력 (촬영 메타 + 노출량 + 이미지) */
export type ReportPptParams = {
  advertiserName: string;
  station: string;
  line: string;
  /** 게재 기간 일수 */
  displayDays: number;
  /** 노출량 결과 */
  exposure: ExposureResult;
  /** 촬영 이미지 base64 목록 (선택, 슬라이드에 삽입) */
  imageBase64s?: string[];
  /** 보고 제목 부가 정보 (예: 사용자직접기입명) */
  subtitle?: string;
  /** 보고 일자 (yyyyMMdd) */
  dateStr?: string;
  /** 캠페인 담당자 이름 (문서 끝 슬라이드) */
  campaignManagerName?: string;
  /** 캠페인 담당자 이메일 (문서 끝 슬라이드) */
  campaignManagerEmail?: string;
};
