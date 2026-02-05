/**
 * Phase 3: 노출량 계산.
 * 노출량 = 유동인구 × 게재 기간(일수) × 가중치.
 */

import type { ExposureInput, ExposureResult } from "./types";

export function calculateExposure(input: ExposureInput): ExposureResult {
  const { flowData, displayDays, weight = 1 } = input;
  const dailyFlow = flowData.dailyTotal;
  const totalExposure = Math.round(dailyFlow * displayDays * weight);
  const byTimeBand =
    flowData.timeBands?.map((tb) => ({
      band: tb.band,
      exposure: Math.round(tb.flow * displayDays * weight),
    }));

  return {
    totalExposure,
    dailyFlow,
    displayDays,
    ...(byTimeBand && byTimeBand.length > 0 ? { byTimeBand } : {}),
  };
}
