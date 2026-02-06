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

function buildPrompt(params: {
  station: string;
  line: string;
  advertiserName: string;
  dateStr: string;
}): string {
  const { station, line, advertiserName, dateStr } = params;
  return `당신은 지하철 광고 성과 분석 전문가입니다.
다음 정보를 바탕으로 한국어로 2~3문장의 분석 요약문을 작성하고, 지표를 추정해 주세요.

[입력]
- 역명: ${station}
- 호선: ${line}
- 광고주: ${advertiserName}
- 기준일: ${dateStr}

[출력 규칙]
아래 JSON만 출력하세요. 다른 설명이나 마크다운 코드블록 없이 JSON만 한 줄로 출력합니다.

{
  "analysisText": "분석 요약 문장 (2~3문장, 한국어)",
  "metrics": {
    "dailyTraffic": 숫자,
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

function parseGeminiJson(text: string): AiAnalysisResult | null {
  const trimmed = text.trim();
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;
  try {
    const raw = JSON.parse(jsonMatch[0]) as unknown;
    if (!raw || typeof raw !== "object") return null;
    const o = raw as Record<string, unknown>;
    const metrics = (o.metrics as Record<string, unknown>) ?? {};
    const chartData = Array.isArray(o.chartData) ? o.chartData : [];
    return {
      analysisText: typeof o.analysisText === "string" ? o.analysisText : "",
      metrics: {
        dailyTraffic: Number(metrics.dailyTraffic) || 0,
        totalExposure: Number(metrics.totalExposure) || 0,
        demographic: String(metrics.demographic ?? ""),
        peakTime: String(metrics.peakTime ?? ""),
        score: Math.min(100, Math.max(0, Number(metrics.score) || 0)),
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
}): AiAnalysisResult {
  const { station, line, advertiserName } = params;
  const trafficBase = 120000 + Math.floor(Math.random() * 50000);
  const score = 85 + Math.floor(Math.random() * 14);
  return {
    analysisText: `${station} ${line}은 유동인구가 풍부한 핵심 역사로, ${advertiserName} 광고의 타겟인 2030 세대 및 직장인 비율이 높습니다. 특히 출퇴근 시간대에 높은 노출 효과를 기대할 수 있으며, AdMate Vision AI 분석 결과 상위 ${100 - score}% 수준의 고효율 스팟으로 평가됩니다. (Mock)`,
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
}): Promise<AiAnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    return getMockResult(params);
  }
  try {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(params);
    const response = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
    });
    const text = response.text?.trim();
    if (!text) return getMockResult(params);
    const parsed = parseGeminiJson(text);
    if (parsed) return parsed;
  } catch (e) {
    console.error("[ai-analysis-service] Gemini API error:", e);
  }
  return getMockResult(params);
}
