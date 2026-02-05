/**
 * Phase 2: 공공데이터 유동인구(승하차) 조회·캐시.
 * DATA_GO_KR_SERVICE_KEY 설정 시 실제 API 호출, 미설정 시 목 데이터 반환.
 */

import type { StationFlowData, TimeBandFlow } from "./types";
import { normalizeStationName, normalizeLineName } from "./station-mapping";

const DATA_GO_KR_SERVICE_KEY = process.env.DATA_GO_KR_SERVICE_KEY ?? "";
const DATA_GO_KR_STATION_FLOW_ENDPOINT =
  process.env.DATA_GO_KR_STATION_FLOW_ENDPOINT ?? "";

/** 메모리 캐시 (실서비스에서는 Redis/DB 등 사용 권장) */
const flowCache = new Map<string, { data: StationFlowData; cachedAt: number }>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1시간

/** 공공 API 응답 item 한 건 (한글/영문 필드 혼용 가능) */
type ApiItem = Record<string, unknown> & {
  역명?: string;
  역코드?: string;
  통행일자?: string;
  통행시간?: string;
  승차인원?: number | string;
  하차인원?: number | string;
  승하차인원?: number | string;
  stnNm?: string;
  trnsDt?: string;
  trnsTm?: string;
  brdngNmpr?: number | string;
  lndngNmpr?: number | string;
};

function toNum(v: number | string | undefined): number {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const n = parseInt(String(v).replace(/,/g, ""), 10);
  return Number.isNaN(n) ? 0 : n;
}

/** 통행시간(예: "07")을 시간대 밴드 라벨로 (예: "07-09") */
function timeToBand(h: string): string {
  const hour = parseInt(h.slice(0, 2), 10);
  if (Number.isNaN(hour)) return "00-24";
  const start = Math.floor(hour / 3) * 3;
  const end = Math.min(start + 3, 24);
  return `${String(start).padStart(2, "0")}-${String(end).padStart(2, "0")}`;
}

/** API 응답 item 배열 → StationFlowData (일평균·시간대별 집계) */
function aggregateToFlowData(
  items: ApiItem[],
  stationName: string,
  lineName: string,
  dataDate: string
): StationFlowData {
  const bandMap = new Map<string, number>();
  let total = 0;
  for (const it of items) {
    const board = toNum(it.승차인원 ?? it.brdngNmpr);
    const alight = toNum(it.하차인원 ?? it.lndngNmpr);
    const combined = toNum(it.승하차인원);
    const flow = combined > 0 ? combined : board + alight;
    const time = String(it.통행시간 ?? it.trnsTm ?? "").trim().slice(0, 2);
    const band = timeToBand(time || "00");
    bandMap.set(band, (bandMap.get(band) ?? 0) + flow);
    total += flow;
  }
  const timeBands: TimeBandFlow[] = Array.from(bandMap.entries())
    .map(([band, flow]) => ({ band, flow }))
    .sort((a, b) => a.band.localeCompare(b.band));
  const dailyTotal = total > 0 ? total : 1;
  return {
    stationName: normalizeStationName(stationName),
    lineName: lineName,
    dailyTotal,
    timeBands: timeBands.length > 0 ? timeBands : undefined,
    dataDate,
  };
}

/**
 * 공공데이터포털 역별승하차인원 API 호출.
 * ENDPOINT 미설정 시 null 반환 (목 데이터 사용).
 */
async function fetchDataGoKrStationFlow(
  station: string,
  line: string
): Promise<StationFlowData | null> {
  if (!DATA_GO_KR_SERVICE_KEY || !DATA_GO_KR_STATION_FLOW_ENDPOINT) {
    return null;
  }
  const baseUrl = DATA_GO_KR_STATION_FLOW_ENDPOINT.replace(/\?$/, "");
  const sep = baseUrl.includes("?") ? "&" : "?";
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const dateStr = yesterday.toISOString().slice(0, 10).replace(/-/g, "");
  const params = new URLSearchParams({
    serviceKey: DATA_GO_KR_SERVICE_KEY,
    type: "json",
    pageNo: "1",
    numOfRows: "500",
    통행일자: dateStr,
    역명: normalizeStationName(station),
  });
  const url = `${baseUrl}${sep}${params.toString()}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const json = (await res.json()) as {
      response?: {
        header?: { resultCode?: string };
        body?: {
          items?: { item?: ApiItem | ApiItem[] };
          totalCount?: number;
        };
      };
    };
    const code = json.response?.header?.resultCode;
    if (code !== "00" && code !== undefined) return null;
    const itemsRaw = json.response?.body?.items?.item;
    const items: ApiItem[] = Array.isArray(itemsRaw)
      ? itemsRaw
      : itemsRaw
        ? [itemsRaw]
        : [];
    if (items.length === 0) return null;
    const lineLabel = line.includes("호선") ? line : `${normalizeLineName(line)}호선`;
    return aggregateToFlowData(items, station, lineLabel, yesterday.toISOString().slice(0, 10));
  } catch {
    return null;
  }
}

/**
 * 목 데이터: 역·호선별 일평균 유동인구.
 * API 미설정 또는 실패 시 사용.
 */
function getMockFlowData(stationName: string, lineName: string): StationFlowData {
  const s = normalizeStationName(stationName);
  const l = normalizeLineName(lineName);
  const baseByLine: Record<string, number> = {
    "1": 12,
    "2": 18,
    "3": 8,
    "4": 10,
    "5": 9,
    "6": 6,
    "7": 8,
    "8": 4,
    "9": 3,
    경의중앙: 5,
    공항: 4,
  };
  const dailyTotal = (baseByLine[l] ?? 8) * 10000;
  const timeBands: TimeBandFlow[] = [
    { band: "07-09", flow: Math.round(dailyTotal * 0.25) },
    { band: "09-12", flow: Math.round(dailyTotal * 0.2) },
    { band: "12-14", flow: Math.round(dailyTotal * 0.15) },
    { band: "14-17", flow: Math.round(dailyTotal * 0.15) },
    { band: "17-20", flow: Math.round(dailyTotal * 0.2) },
    { band: "20-23", flow: Math.round(dailyTotal * 0.05) },
  ];
  return {
    stationName: s,
    lineName: l + "호선",
    dailyTotal,
    timeBands,
    dataDate: new Date().toISOString().slice(0, 10),
  };
}

/**
 * 역·호선별 유동인구 조회.
 * API 키·엔드포인트 설정 시 실제 공공 API 호출, 그 외에는 목 데이터 반환. 캐시 적용.
 */
export async function fetchStationFlow(
  station: string,
  line: string
): Promise<{ ok: true; data: StationFlowData } | { ok: false; error: string }> {
  const key = `${normalizeStationName(station)}|${normalizeLineName(line)}`;
  const cached = flowCache.get(key);
  if (cached && Date.now() - cached.cachedAt < CACHE_TTL_MS) {
    return { ok: true, data: cached.data };
  }
  const apiData = await fetchDataGoKrStationFlow(station, line);
  const data = apiData ?? getMockFlowData(station, line);
  flowCache.set(key, { data, cachedAt: Date.now() });
  return { ok: true, data };
}
