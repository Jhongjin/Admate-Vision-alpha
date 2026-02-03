/**
 * OCR로 추출한 텍스트와 등록된 광고주 목록을 매칭.
 * 파일명이 아닌 이미지 내 텍스트만 사용한다.
 */

import type { Advertiser } from "@/features/capture/data/dummy-advertisers";

export type MatchResult = {
  advertiserId: string;
  advertiserName: string;
  confidence: number;
};

/** 매칭 신뢰도 임계값: 이 이상이면 인식 성공으로 간주 (짧은 키워드만 매칭돼도 통과하도록 완화) */
const CONFIDENCE_THRESHOLD = 0.15;

/**
 * OCR 텍스트 정규화: 공백·줄바꿈 축소, 소문자화(영문 매칭용).
 */
function normalizeForMatch(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * 공백 완전 제거 버전 (OCR이 "vip자산운용" 등으로 읽을 수 있음).
 */
function normalizeNoSpaces(raw: string): string {
  return raw.replace(/\s+/g, "").toLowerCase();
}

/**
 * OCR 텍스트에 키워드가 포함돼 있는지 확인.
 * 공백 있는/없는 두 정규화 버전 모두 검사.
 */
function textContains(
  ocrNormalized: string,
  ocrNoSpaces: string,
  termNorm: string,
  termNoSpaces: string
): boolean {
  return (
    ocrNormalized.includes(termNorm) || ocrNoSpaces.includes(termNoSpaces)
  );
}

/**
 * OCR로 추출한 텍스트에서 등록된 광고주를 찾는다.
 * 각 광고주의 searchTerms가 OCR 텍스트에 포함된 경우 점수를 부여하고,
 * 가장 높은 점수의 광고주를 반환한다.
 * 공백 유무 차이를 흡수하고, 짧은 키워드만 매칭돼도 인식되도록 confidence 계산을 완화했다.
 *
 * @param ocrText - OCR로 추출한 전체 텍스트
 * @param advertisers - 등록된 광고주 목록
 * @returns 매칭된 광고주와 신뢰도. 없으면 null
 */
export function matchOcrToAdvertiser(
  ocrText: string,
  advertisers: Advertiser[]
): MatchResult | null {
  const ocrNormalized = normalizeForMatch(ocrText);
  const ocrNoSpaces = normalizeNoSpaces(ocrText);
  if (!ocrNormalized && !ocrNoSpaces) return null;

  let best: { advertiser: Advertiser; score: number; maxMatchedLen: number } | null =
    null;

  for (const advertiser of advertisers) {
    let score = 0;
    let maxMatchedLen = 0;
    for (const term of advertiser.searchTerms) {
      const termNorm = normalizeForMatch(term);
      const termNoSpaces = normalizeNoSpaces(term);
      if (!termNorm && !termNoSpaces) continue;
      if (
        textContains(ocrNormalized, ocrNoSpaces, termNorm, termNoSpaces)
      ) {
        const len = termNorm.length || termNoSpaces.length;
        score += len;
        if (len > maxMatchedLen) maxMatchedLen = len;
      }
    }
    if (score > 0) {
      if (
        !best ||
        score > best.score ||
        (score === best.score && maxMatchedLen > best.maxMatchedLen)
      ) {
        best = { advertiser, score, maxMatchedLen };
      }
    }
  }

  if (!best) return null;

  const maxTermLen = Math.max(
    ...best.advertiser.searchTerms.map((t) =>
      Math.max(
        normalizeForMatch(t).length,
        normalizeNoSpaces(t).length
      )
    ),
    1
  );
  const rawConfidence = (best.score / maxTermLen) * 1.2;
  const minConfidenceForShortMatch =
    best.maxMatchedLen >= 2 ? 0.5 : 0;
  const confidence = Math.min(
    1,
    Math.max(rawConfidence, minConfidenceForShortMatch)
  );

  if (confidence < CONFIDENCE_THRESHOLD) return null;

  return {
    advertiserId: best.advertiser.id,
    advertiserName: best.advertiser.name,
    confidence,
  };
}
