/**
 * 지하철 역명판 OCR 결과에서 역명·역번호(호선 추정) 추출.
 * 예: "529 공 덕 Gongdeok" → stationNumber 529, line "5호선", stationName "공덕"
 */

export type StationFromOcrResult = {
  /** 역번호 (예: 529) - 호선 추정에 사용 */
  stationNumber: number | null;
  /** 호선 (예: "5호선") - 역번호 첫 자리로 추정 */
  line: string | null;
  /** 역명 한글 (예: "공덕") */
  stationName: string | null;
};

/** 3자리 역번호 → 호선 (서울 지하철: 1xx=1호선, 2xx=2호선, ...) */
function lineFromStationNumber(num: number): string | null {
  if (num < 100 || num > 999) return null;
  const first = Math.floor(num / 100);
  if (first >= 1 && first <= 9) return `${first}호선`;
  return null;
}

/** 한글만 추출 (2~4자 역명 후보) */
function extractKoreanStationName(text: string): string | null {
  const koreanBlock = /[\uAC00-\uD7A3]+/g;
  const matches = text.match(koreanBlock);
  if (!matches || matches.length === 0) return null;
  const candidates = matches.filter((m) => m.length >= 2 && m.length <= 5);
  if (candidates.length === 0) return null;
  const best = candidates.find((m) => m.length >= 2 && m.length <= 4);
  return (best ?? candidates[0]).replace(/\s/g, "");
}

/** 3자리 숫자 추출 (역번호) */
function extractStationNumber(text: string): number | null {
  const threeDigit = /\b([1-9]\d{2})\b/;
  const m = text.match(threeDigit);
  if (!m) return null;
  const num = parseInt(m[1], 10);
  return num >= 100 && num <= 999 ? num : null;
}

/**
 * OCR 텍스트에서 역명·역번호·호선 추출.
 */
export function parseStationFromOcr(ocrText: string): StationFromOcrResult {
  const trimmed = (ocrText ?? "").trim();
  const stationNumber = extractStationNumber(trimmed);
  const line = stationNumber != null ? lineFromStationNumber(stationNumber) : null;
  const stationName = extractKoreanStationName(trimmed);
  return {
    stationNumber,
    line,
    stationName,
  };
}
