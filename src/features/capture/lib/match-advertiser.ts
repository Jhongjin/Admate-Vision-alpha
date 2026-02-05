/**
 * OCR로 추출한 텍스트 전수 조사 후, 기 등록 광고주 정보와 매칭하여
 * 이미지에 포함된 텍스트와 등록 텍스트가 가장 유사한 광고주를 선별.
 * - Exact: 등록 검색어가 OCR 텍스트에 포함되면 가산
 * - Fuzzy: Levenshtein 기반 유사도로 오인식·띄어쓰기 차이 흡수
 */

import { distance } from "fastest-levenshtein";

/** OCR 매칭에 필요한 최소 광고주 필드 (Supabase/API 응답과 호환) */
export type AdvertiserForMatch = {
  id: string;
  name: string;
  searchTerms?: string[];
};

export type MatchResult = {
  advertiserId: string;
  advertiserName: string;
  confidence: number;
};

/** 매칭 신뢰도 임계값: 이 이상이면 인식 성공 */
const CONFIDENCE_THRESHOLD = 0.2;

/** Exact 매칭 가중치 (fuzzy보다 우선) */
const EXACT_WEIGHT = 10;

/** Fuzzy 유사도에 쓸 검색어 최소 길이 (짧은 단어는 OCR 노이즈에 잘못 매칭됨 → LG 등 오인식 방지) */
const MIN_FUZZY_TERM_LENGTH = 4;

/** 긴 검색어(전체 이름 등)는 OCR 전체 문장과도 유사도 비교 (예: 서울특별시교육청보건안전진흥 vs 진흥원) */
const LONG_TERM_LENGTH = 10;

/**
 * 정규화: 공백·줄바꿈 축소, 소문자화.
 */
function normalize(raw: string): string {
  return raw.replace(/\s+/g, " ").trim().toLowerCase();
}

/**
 * 공백 제거 버전 (OCR 변형 흡수).
 */
function normalizeNoSpaces(raw: string): string {
  return raw.replace(/\s+/g, "").toLowerCase();
}

/**
 * Levenshtein 거리 → 유사도 (0~1). 동일하면 1.
 */
function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const maxLen = Math.max(a.length, b.length, 1);
  const d = distance(a, b);
  return 1 - d / maxLen;
}

/**
 * OCR 텍스트에 검색어가 포함돼 있는지 (공백 유무 둘 다 검사).
 */
function exactContains(
  ocrNorm: string,
  ocrNoSpaces: string,
  termNorm: string,
  termNoSpaces: string
): boolean {
  return ocrNorm.includes(termNorm) || ocrNoSpaces.includes(termNoSpaces);
}

/**
 * OCR 텍스트를 토큰으로 분리 (공백·줄바꿈 기준, 1자 이상).
 */
function tokenize(ocrText: string): string[] {
  const norm = normalize(ocrText);
  const noSpaces = normalizeNoSpaces(ocrText);
  const bySpace = norm.split(/\s+/).filter((s) => s.length >= 1);
  const tokens = new Set<string>(bySpace);
  if (noSpaces.length >= 2) tokens.add(noSpaces);
  return Array.from(tokens);
}

/**
 * 한 검색어와 OCR 토큰들 중 최대 유사도.
 * 긴 검색어(광고주 전체 이름 등)는 OCR 전체 문자열과도 비교해, 일부만 다를 때(예: 진흥 vs 진흥원) 매칭되도록 함.
 */
function bestFuzzySimilarity(
  termNorm: string,
  ocrTokens: string[],
  ocrNorm: string,
  ocrNoSpaces: string
): number {
  if (!termNorm.length) return 0;
  let best = 0;
  for (const token of ocrTokens) {
    if (!token.length) continue;
    const sim = similarity(termNorm, token);
    if (sim > best) best = sim;
  }
  if (termNorm.length >= LONG_TERM_LENGTH) {
    const fullSimNorm = similarity(termNorm, ocrNorm);
    const fullSimNoSpaces = similarity(termNorm, ocrNoSpaces);
    if (fullSimNorm > best) best = fullSimNorm;
    if (fullSimNoSpaces > best) best = fullSimNoSpaces;
  }
  return best;
}

/**
 * 이미지 텍스트(OCR 결과) 전수 조사 후, 등록된 광고주 중
 * 이미지 텍스트와 등록 텍스트가 가장 유사한 광고주를 선별.
 *
 * @param ocrText - OCR로 추출한 전체 텍스트
 * @param advertisers - 등록된 광고주 목록
 * @returns 가장 유사한 광고주와 신뢰도. 없거나 임계값 미만이면 null
 */
export function matchOcrToAdvertiser(
  ocrText: string,
  advertisers: AdvertiserForMatch[]
): MatchResult | null {
  const ocrNorm = normalize(ocrText);
  const ocrNoSpaces = normalizeNoSpaces(ocrText);
  if (!ocrNorm.length && !ocrNoSpaces.length) return null;

  const ocrTokens = tokenize(ocrText);

  let best: {
    advertiser: AdvertiserForMatch;
    exactScore: number;
    fuzzyScore: number;
    maxMatchedLen: number;
    maxFuzzySim: number;
  } | null = null;

  for (const advertiser of advertisers) {
    let exactScore = 0;
    let maxMatchedLen = 0;
    let fuzzySum = 0;
    let maxFuzzySim = 0;

    const rawTerms = advertiser.searchTerms ?? [];
    const nameNorm = normalize(advertiser.name);
    const terms = Array.from(
      new Set([
        ...rawTerms,
        ...(nameNorm && !rawTerms.some((t) => normalize(t) === nameNorm)
          ? [advertiser.name]
          : []),
      ])
    ).filter(Boolean);
    for (const term of terms) {
      const termNorm = normalize(term);
      const termNoSpaces = normalizeNoSpaces(term);
      if (!termNorm.length && !termNoSpaces.length) continue;

      if (exactContains(ocrNorm, ocrNoSpaces, termNorm, termNoSpaces)) {
        const len = termNorm.length || termNoSpaces.length;
        exactScore += len;
        if (len > maxMatchedLen) maxMatchedLen = len;
      }

      const termLen = termNorm.length || termNoSpaces.length;
      const fuzzySim =
        termLen >= MIN_FUZZY_TERM_LENGTH
          ? bestFuzzySimilarity(termNorm, ocrTokens, ocrNorm, ocrNoSpaces)
          : 0;
      fuzzySum += fuzzySim;
      if (fuzzySim > maxFuzzySim) maxFuzzySim = fuzzySim;
    }

    const combined =
      exactScore * EXACT_WEIGHT + fuzzySum;

    if (combined <= 0) continue;

    const prevCombined = best ? best.exactScore * EXACT_WEIGHT + best.fuzzyScore : 0;
    const wins =
      !best ||
      combined > prevCombined ||
      (combined === prevCombined &&
        (maxMatchedLen > (best?.maxMatchedLen ?? 0) ||
          (maxMatchedLen === (best?.maxMatchedLen ?? 0) && maxFuzzySim > (best?.maxFuzzySim ?? 0))));
    if (wins) {
      best = {
        advertiser,
        exactScore,
        fuzzyScore: fuzzySum,
        maxMatchedLen,
        maxFuzzySim,
      };
    }
  }

  if (!best) return null;

  const rawBestTerms = best.advertiser.searchTerms ?? [];
  const bestNameNorm = normalize(best.advertiser.name);
  const terms = [
    ...rawBestTerms,
    ...(bestNameNorm && !rawBestTerms.some((t) => normalize(t) === bestNameNorm)
      ? [best.advertiser.name]
      : []),
  ].filter(Boolean);
  const maxTermLen = Math.max(
    ...terms.map((t) =>
      Math.max(normalize(t).length, normalizeNoSpaces(t).length)
    ),
    1
  );

  let confidence: number;
  if (best.exactScore > 0) {
    const rawConfidence = (best.exactScore / maxTermLen) * 1.2;
    const minConf = best.maxMatchedLen >= 2 ? 0.5 : 0;
    confidence = Math.min(1, Math.max(rawConfidence, minConf));
  } else {
    const termCount = terms.length || 1;
    const avgFuzzy = best.fuzzyScore / termCount;
    confidence = Math.min(1, avgFuzzy * 1.2);
  }

  if (confidence < CONFIDENCE_THRESHOLD) return null;

  return {
    advertiserId: best.advertiser.id,
    advertiserName: best.advertiser.name,
    confidence,
  };
}
