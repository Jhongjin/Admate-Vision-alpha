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

/** 매칭 신뢰도 임계값: 이 이상이면 인식 성공으로 간주 */
const CONFIDENCE_THRESHOLD = 0.3;

/**
 * OCR 텍스트를 정규화: 공백·줄바꿈 축소, 소문자화(영문 매칭용).
 */
function normalizeForMatch(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/**
 * OCR로 추출한 텍스트에서 등록된 광고주를 찾는다.
 * 각 광고주의 searchTerms가 OCR 텍스트에 포함된 경우 점수를 부여하고,
 * 가장 높은 점수의 광고주를 반환한다.
 *
 * @param ocrText - OCR로 추출한 전체 텍스트
 * @param advertisers - 등록된 광고주 목록
 * @returns 매칭된 광고주와 신뢰도. 없으면 null
 */
export function matchOcrToAdvertiser(
  ocrText: string,
  advertisers: Advertiser[]
): MatchResult | null {
  const normalized = normalizeForMatch(ocrText);
  if (!normalized) return null;

  let best: { advertiser: Advertiser; score: number } | null = null;

  for (const advertiser of advertisers) {
    let score = 0;
    for (const term of advertiser.searchTerms) {
      const termNorm = normalizeForMatch(term);
      if (!termNorm) continue;
      if (normalized.includes(termNorm)) {
        score += termNorm.length;
      }
    }
    if (score > 0) {
      if (!best || score > best.score) {
        best = { advertiser, score };
      }
    }
  }

  if (!best) return null;

  const maxPossibleScore = Math.max(
    ...best.advertiser.searchTerms.map((t) => normalizeForMatch(t).length)
  );
  const confidence = Math.min(
    1,
    (best.score / Math.max(maxPossibleScore, 1)) * 1.2
  );

  if (confidence < CONFIDENCE_THRESHOLD) return null;

  return {
    advertiserId: best.advertiser.id,
    advertiserName: best.advertiser.name,
    confidence,
  };
}
