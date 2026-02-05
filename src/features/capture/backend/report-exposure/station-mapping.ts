/**
 * 역명·호선 정규화 및 공공 API 역 코드 매핑.
 * 공공데이터 API는 역코드/역명으로 조회하므로, 촬영 시 저장한 역명·호선을 정규화해 사용.
 */

/** 역명 정규화 (공백·괄호 제거, trim) */
export function normalizeStationName(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .replace(/\s*\([^)]*\)\s*/g, "")
    .trim();
}

/** 호선 정규화 (예: "5호선" → "5", "경의중앙선" 유지) */
export function normalizeLineName(line: string): string {
  const t = line.trim();
  const m = t.match(/^(\d+)호선$/);
  return m ? m[1]! : t;
}

/**
 * 촬영 메타(역명, 호선)로 공공 API 조회용 키 생성.
 * 실제 API는 역코드가 필요할 수 있으므로, 추후 역코드 매핑 테이블 확장 가능.
 */
export function stationLineKey(station: string, line: string): string {
  const s = normalizeStationName(station);
  const l = normalizeLineName(line);
  return `${s}|${l}`;
}
