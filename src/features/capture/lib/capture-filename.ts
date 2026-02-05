/**
 * 촬영 결과 파일명 생성: {광고주}_{호선}_{역명}_{사용자직접기입명}_{YYYYMMdd}_{01~99}.jpg
 * 사용자직접기입명은 비어 있으면 생략 (역명 다음이 날짜).
 */

/** 파일명에 사용할 수 없는 문자 제거/대체 */
export function sanitizeFilenamePart(value: string): string {
  if (value == null || typeof value !== "string") return "";
  const replaced = value
    .replace(/[/\\:*?"<>|]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return replaced.slice(0, 80) || "unknown";
}

/**
 * 최종 저장용 파일명 생성.
 * @param advertiserName - 인식된 광고주명
 * @param subwayLine - 지하철 호선 (예: 5호선)
 * @param stationName - 지하철 역명 (예: 공덕)
 * @param userEnteredName - 사용자직접기입명 (예: DL16), 비어 있으면 생략
 * @param dateStr - YYYYMMDD
 * @param photoIndex - 사진 번호 (1-based, 01~99)
 */
export function buildCaptureFilename(
  advertiserName: string,
  subwayLine: string,
  stationName: string,
  userEnteredName: string,
  dateStr: string,
  photoIndex: number
): string {
  const adv = sanitizeFilenamePart(advertiserName);
  const line = sanitizeFilenamePart(subwayLine);
  const station = sanitizeFilenamePart(stationName);
  const userPart = sanitizeFilenamePart(userEnteredName);
  const date = /^\d{8}$/.test(dateStr) ? dateStr : dateStr.replace(/\D/g, "").slice(0, 8) || "00000000";
  const seq = String(Math.max(1, Math.min(99, Math.floor(photoIndex)))).padStart(2, "0");
  const parts = [adv, line, station];
  if (userPart) parts.push(userPart);
  parts.push(date, seq);
  return `${parts.join("_")}.jpg`;
}
