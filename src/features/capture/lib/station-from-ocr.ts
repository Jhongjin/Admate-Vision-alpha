/**
 * 지하철 역명판 OCR 결과에서 역명·역번호(호선 추정) 추출.
 * 역명이 화이트리스트에 있으면 역명→호선 매칭으로 호선 자동 결정(예: 여의도 → 5호선).
 * 1·2·5·7·8호선만 사용하며, 나머지 호선 정보는 제외.
 */

import { getLineForStation, getStationNameFromNumber, isKnownStationName, isSupportedLine } from "./station-whitelist";

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

/** 역명으로 쓰이면 안 되는 문구 (요청/채팅 등이 OCR에 섞였을 때 차단) */
const INVALID_STATION_PHRASES = [
  "배포에줘",
  "배포해줘",
  "배포해주",
  "배포에주",
  "도시",
  "신한",
];

function isInvalidStationName(name: string): boolean {
  const n = name.replace(/\s/g, "");
  return INVALID_STATION_PHRASES.some((phrase) => n.includes(phrase) || phrase.includes(n));
}

/** 한글만 추출 (2~4자 역명 후보). 역번호 인근 한글을 우선. */
function extractKoreanStationName(text: string): string | null {
  const koreanBlock = /[\uAC00-\uD7A3]+/g;
  const matches = text.match(koreanBlock);
  if (!matches || matches.length === 0) return null;
  let candidates = matches.filter((m) => m.length >= 2 && m.length <= 5);
  candidates = candidates.filter((m) => !isInvalidStationName(m.replace(/\s/g, "")));
  if (candidates.length === 0) return null;
  const stationNumber = extractStationNumber(text);
  if (stationNumber != null) {
    const numStr = String(stationNumber);
    const idx = text.indexOf(numStr);
    if (idx >= 0) {
      const afterNum = text.slice(idx + numStr.length);
      const afterKorean = afterNum.match(koreanBlock);
      if (afterKorean?.length) {
        // OCR이 "군 자"를 "군", "자"로 분리하는 경우 합쳐서 역명 후보 생성 (예: 군자)
        const joined = afterKorean.join("").replace(/\s/g, "");
        const trimmed = joined.slice(0, 6);
        if (trimmed.length >= 2 && !isInvalidStationName(trimmed)) return trimmed;
      }
    }
  }
  const best = candidates.find((m) => m.length >= 2 && m.length <= 4) ?? candidates[0];
  const cleaned = (best ?? candidates[0]).replace(/\s/g, "");
  return isInvalidStationName(cleaned) ? null : cleaned;
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
 * 역명은 화이트리스트(1·2·5·7·8호선)에 있을 때만 반환.
 * 호선은 역명→호선 매칭으로 결정(예: 여의도 → 5호선). 1·2·5·7·8호선만 허용.
 */
/** 역명 후보 문자열에서 화이트리스트에 있는 역명 추출 (접두사 2~4글자 시도). 예: "군자능동" → "군자" */
function resolveStationName(rawName: string): string | null {
  if (!rawName || rawName.length < 2) return null;
  for (let len = Math.min(4, rawName.length); len >= 2; len--) {
    const candidate = rawName.slice(0, len);
    if (isKnownStationName(candidate)) return candidate;
  }
  return null;
}

export function parseStationFromOcr(ocrText: string): StationFromOcrResult {
  const trimmed = (ocrText ?? "").trim();
  const stationNumber = extractStationNumber(trimmed);
  const rawName = extractKoreanStationName(trimmed);
  let stationName = rawName != null ? resolveStationName(rawName) : null;

  let line: string | null = null;
  if (stationName != null) {
    line = getLineForStation(stationName);
  } else if (stationNumber != null) {
    const fromNum = lineFromStationNumber(stationNumber);
    line = fromNum != null && isSupportedLine(fromNum) ? fromNum : null;
    // 역번호만 인식되고 역명 OCR 실패 시, 역번호→역명 매핑으로 보조 추정 (예: 544→군자)
    if (stationName == null && line != null) {
      stationName = getStationNameFromNumber(stationNumber);
    }
  }

  return {
    stationNumber,
    line,
    stationName,
  };
}
