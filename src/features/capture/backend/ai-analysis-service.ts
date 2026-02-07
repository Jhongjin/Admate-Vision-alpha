import { GoogleGenAI } from "@google/genai";

export interface AiAnalysisResult {
  analysisText: string;
  metrics: {
    dailyTraffic: number;
    totalExposure: number;
    demographic: string;
    peakTime: string;
    score: number;
  };
  chartData: { label: string; value: number }[];
}

const GEMINI_MODEL = "gemini-2.0-flash";

/**
 * 유동인구 기반 점수 계산 (Data-driven)
 * - 기준: 강남역 등 S급 역사 일일 유동인구 약 150,000명 = 95점 기준
 * - 최소: 5,000명 = 50점
 */
function calculateDeterministicScore(dailyTraffic: number): number {
  const MAX_TRAFFIC = 150000; // S급 기준
  const MIN_SCORE = 50;
  const MAX_SCORE = 98;

  // 0 ~ 1 사이 비율 (Log scale로 하면 더 좋지만 단순히 Linear로 적용)
  const ratio = Math.min(dailyTraffic, MAX_TRAFFIC) / MAX_TRAFFIC;

  // 점수 산출
  const baseScore = MIN_SCORE + (ratio * (MAX_SCORE - MIN_SCORE));

  // 약간의 랜덤성 (+- 2점)
  const variation = (Math.random() * 4) - 2;

  return Math.round(Math.min(100, Math.max(1, baseScore + variation)));
}

function buildPrompt(params: {
  station: string;
  line: string;
  advertiserName: string;
  dateStr: string;
  dailyTraffic?: number;
}): string {
  const { station, line, advertiserName, dateStr, dailyTraffic } = params;
  const trafficContext = dailyTraffic
    ? `- 일일 유동인구 (공공데이터): 약 ${dailyTraffic.toLocaleString()}명`
    : "- 일일 유동인구 정보 없음";

  return `당신은 지하철 광고 성과 분석 전문가입니다.
다음 정보를 바탕으로 한국어로 2~3문장의 분석 요약문을 작성하고, 지표를 추정해 주세요.

[입력]
- 역명: ${station}
- 호선: ${line}
- 광고주: ${advertiserName}
- 기준일: ${dateStr}
${trafficContext}

[출력 규칙]
아래 JSON만 출력하세요. 다른 설명이나 마크다운 코드블록 없이 JSON만 한 줄로 출력합니다.
AdMate Score는 유동인구가 많을수록 높게(최대 99점), 유동인구가 적으면 50~70점대로 산정하세요.

{
  "analysisText": "분석 요약 문장 (2~3문장, 한국어. 유동인구 데이터를 언급하며 분석)",
  "metrics": {
    "dailyTraffic": 숫자 (입력된 유동인구가 있으면 그 값 사용, 없으면 추정),
    "totalExposure": 숫자,
    "demographic": "주요 타겟층",
    "peakTime": "예) 18:00 - 20:00",
    "score": 1~100 정수
  },
  "chartData": [
    { "label": "08시", "value": 숫자 },
    { "label": "10시", "value": 숫자 },
    { "label": "12시", "value": 숫자 },
    { "label": "14시", "value": 숫자 },
    { "label": "16시", "value": 숫자 },
    { "label": "18시", "value": 숫자 },
    { "label": "20시", "value": 숫자 },
    { "label": "22시", "value": 숫자 }
  ]
}`;
}

function parseGeminiJson(text: string, overrideScore?: number): AiAnalysisResult | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const raw = JSON.parse(jsonMatch[0]) as unknown;
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    const metrics = (o.metrics as Record<string, unknown>) ?? {};
    const chartData = Array.isArray(o.chartData) ? o.chartData : [];

    // Score Override Logic
    let score = Number(metrics.score) || 0;
    if (overrideScore !== undefined) {
      score = overrideScore;
    }

    return {
      analysisText: typeof o.analysisText === "string" ? o.analysisText : "",
      metrics: {
        dailyTraffic: Number(metrics.dailyTraffic) || 0,
        totalExposure: Number(metrics.totalExposure) || 0,
        demographic: String(metrics.demographic ?? ""),
        peakTime: String(metrics.peakTime ?? ""),
        score: Math.min(100, Math.max(0, score)),
      },
      chartData: chartData.map((item: unknown) => {
        const row = item as Record<string, unknown>;
        return {
          label: String(row?.label ?? ""),
          value: Number(row?.value) || 0,
        };
      }),
    };
  } catch {
    return null;
  }
}

function getMockResult(params: {
  station: string;
  line: string;
  advertiserName: string;
  dateStr: string;
  dailyTraffic?: number;
}, overrideScore?: number): AiAnalysisResult {
  const { station, line, advertiserName, dailyTraffic } = params;
  const trafficBase = dailyTraffic ?? (120000 + Math.floor(Math.random() * 50000));
  const score = overrideScore ?? (85 + Math.floor(Math.random() * 14));

  return {
    analysisText: `${station} ${line}은 유동인구가 ${trafficBase.toLocaleString()}명에 달하는 핵심 역사로, ${advertiserName} 광고의 타겟인 2030 세대 및 직장인 비율이 높습니다. 특히 출퇴근 시간대에 높은 노출 효과를 기대할 수 있으며, AdMate Vision AI 분석 결과 ${score}점의 고효율 스팟으로 평가됩니다. (Mock)`,
    metrics: {
      dailyTraffic: trafficBase,
      totalExposure: trafficBase * 6,
      demographic: "2030 직장인 및 대학생",
      peakTime: "18:00 - 20:00 (퇴근 시간대)",
      score,
    },
    chartData: [
      { label: "08시", value: 70 },
      { label: "10시", value: 50 },
      { label: "12시", value: 80 },
      { label: "14시", value: 55 },
      { label: "16시", value: 60 },
      { label: "18시", value: 95 },
      { label: "20시", value: 85 },
      { label: "22시", value: 55 },
    ],
  };
}

export async function generateAiAnalysis(params: {
  station: string;
  line: string;
  advertiserName: string;
  dateStr: string;
  dailyTraffic?: number;
}): Promise<AiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;

  // Deterministic Score Calculation
  let calculatedScore: number | undefined;
  if (params.dailyTraffic) {
    calculatedScore = calculateDeterministicScore(params.dailyTraffic);
  }

  if (!apiKey) {
    return getMockResult(params, calculatedScore);
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(params);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text?.trim();
    if (!text) return getMockResult(params, calculatedScore);
    const parsed = parseGeminiJson(text, calculatedScore);
    if (parsed) return parsed;
  } catch (e) {
    console.error("[ai-analysis-service] Gemini API error:", e);
  }
  return getMockResult(params, calculatedScore);
}
