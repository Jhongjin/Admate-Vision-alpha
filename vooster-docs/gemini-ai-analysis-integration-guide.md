# AI 성과 분석: Gemini API 연동 가이드

`src/features/capture/backend/ai-analysis-service.ts`는 현재 **Mock 데이터**를 반환합니다. 실제 운영 시 **Google Gemini API**를 호출해 역명·호선·광고주 정보를 기반으로 성과 분석 텍스트와 지표를 생성하도록 연동하는 방법을 정리했습니다.

---

## 1. 현황 및 목표

| 항목 | 내용 |
|------|------|
| **현재** | `generateAiAnalysis()`가 Mock으로 고정된 수치·텍스트 반환 |
| **목표** | Gemini API 호출 → 역/호선/광고주/날짜 기반 분석 문장 및 지표 생성 |
| **파일** | `src/features/capture/backend/ai-analysis-service.ts` |

**참고: 보고 발송 버튼이 반응하지 않던 이슈**  
- "보고 발송하기" 버튼이 **광고주 미인식 + 다중 세션**일 때 `disabled`라서 클릭해도 아무 동작이 없을 수 있었습니다.  
- 버튼은 **발송 중일 때만** 비활성화하도록 수정되어, 광고주 미인식 시 클릭하면 "보고 발송 불가" 토스트가 뜨도록 되어 있습니다.

---

## 2. 사전 준비

### 2.1 API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey) 접속 후 로그인
2. **Get API key** / **Create API key** 선택
3. 프로젝트 선택(없으면 새로 생성) 후 API 키 복사
4. **절대** 클라이언트 코드나 Git에 키를 넣지 말고, **서버 환경 변수**로만 사용

### 2.2 환경 변수 설정

- **이름**: `GEMINI_API_KEY` 또는 `GOOGLE_API_KEY`  
  (공식 라이브러리는 둘 중 하나를 자동 인식하며, `GOOGLE_API_KEY`가 우선)
- **로컬**: `.env.local`에 추가
- **Vercel**: 프로젝트 → Settings → Environment Variables에 추가

```bash
# .env.local 예시
GEMINI_API_KEY=your_api_key_here
```

---

## 3. 패키지 설치

공식 JavaScript/TypeScript SDK 사용을 권장합니다.

```bash
npm install @google/genai
```

- **Node.js**: 20 이상
- **문서**: [Gemini API - Libraries](https://ai.google.dev/gemini-api/docs/libraries)

---

## 4. 연동 방식 개요

1. **환경 변수**에 `GEMINI_API_KEY`가 있으면 → Gemini `generateContent` 호출
2. **없거나 호출 실패** 시 → 기존 Mock 반환(폴백)
3. **프롬프트**에서 역명·호선·광고주·날짜를 넣고, **JSON 형태**로만 답하도록 지시
4. 응답 텍스트를 파싱해 `AiAnalysisResult` 타입으로 매핑

---

## 5. `AiAnalysisResult` 타입 (유지)

연동 후에도 기존 타입을 그대로 사용합니다.

```ts
// ai-analysis-service.ts 에 이미 정의된 타입
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
```

---

## 6. 프롬프트 설계 예시

Gemini에게 **역할**과 **입력**, **출력 형식(JSON만)**을 명확히 주는 것이 좋습니다.

- **역할**: 지하철 광고 성과 분석 전문가
- **입력**: 역명, 호선, 광고주명, 게재일(또는 날짜 문자열)
- **출력**: 아래 필드만 가진 **단일 JSON 객체** (주석/설명 없이)

예시 프롬프트:

```text
당신은 지하철 광고 성과 분석 전문가입니다.
다음 정보를 바탕으로 한국어로 2~3문장의 분석 요약문을 작성하고, 지표를 추정해 주세요.

[입력]
- 역명: {{station}}
- 호선: {{line}}
- 광고주: {{advertiserName}}
- 기준일: {{dateStr}}

[출력 규칙]
아래 JSON만 출력하세요. 다른 설명이나 마크다운 코드블록 없이 JSON만 한 줄로 출력합니다.

{
  "analysisText": "분석 요약 문장 (2~3문장, 한국어)",
  "metrics": {
    "dailyTraffic": 숫자(일 유동인구 추정),
    "totalExposure": 숫자(총 노출 추정),
    "demographic": "주요 타겟층 설명",
    "peakTime": "피크 시간대 예) 18:00 - 20:00",
    "score": 1~100 정수(효율 점수)
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
}
```

실제 코드에서는 `{{station}}`, `{{line}}`, `{{advertiserName}}`, `{{dateStr}}`를 파라미터로 치환합니다.

---

## 7. 코드 연동 예시 (ai-analysis-service.ts)

아래는 **연동 시 참고용** 구조입니다. 실제 파일에 맞게 import 경로와 에러 처리만 조정하면 됩니다.

```ts
import { GoogleGenAI } from "@google/genai";

const GEMINI_MODEL = "gemini-2.0-flash"; // 또는 gemini-1.5-flash

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
    const metrics = o.metrics as Record<string, unknown>;
    const chartData = Array.isArray(o.chartData) ? o.chartData : [];
    return {
      analysisText: typeof o.analysisText === "string" ? o.analysisText : "",
      metrics: {
        dailyTraffic: Number(metrics?.dailyTraffic) || 0,
        totalExposure: Number(metrics?.totalExposure) || 0,
        demographic: String(metrics?.demographic ?? ""),
        peakTime: String(metrics?.peakTime ?? ""),
        score: Math.min(100, Math.max(0, Number(metrics?.score) || 0)),
      },
      chartData: chartData.map((item: unknown) => {
        const o = item as Record<string, unknown>;
        return {
          label: String(o?.label ?? ""),
          value: Number(o?.value) || 0,
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
    analysisText: `${station} ${line}은 유동인구가 풍부한 핵심 역사로, ${advertiserName} 광고의 타겟인 2030 세대 및 직장인 비율이 높습니다. (Mock)`,
    metrics: {
      dailyTraffic: trafficBase,
      totalExposure: trafficBase * 6,
      demographic: "2030 직장인 및 대학생",
      peakTime: "18:00 - 20:00 (퇴근 시간대)",
      score,
    },
    chartData: [
      { label: "08시", value: 70 }, { label: "10시", value: 50 },
      { label: "12시", value: 80 }, { label: "14시", value: 55 },
      { label: "16시", value: 60 }, { label: "18시", value: 95 },
      { label: "20시", value: 85 }, { label: "22시", value: 55 },
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
```

- **GEMINI_API_KEY / GOOGLE_API_KEY** 없음 → Mock 반환
- **Gemini 호출 실패** 또는 **JSON 파싱 실패** → Mock 반환
- **성공** → 파싱된 `AiAnalysisResult` 반환

---

## 8. 모델 선택

| 모델 ID | 비고 |
|--------|------|
| `gemini-2.0-flash` | 최신 Flash, 권장 |
| `gemini-1.5-flash` | 안정적, 비용·속도 균형 |
| `gemini-1.5-pro` | 더 복잡한 분석 시 |

[모델 목록](https://ai.google.dev/gemini-api/docs/models)에서 최신 이름을 확인하세요.

---

## 9. 로컬에서 형태·내용 테스트

### 9.1 터미널 (JSON)

프로젝트 루트에서 다음 명령으로 **Gemini 호출 결과**를 콘솔에 출력해 확인할 수 있습니다.

```bash
npm run test:ai-analysis
```

- `.env.local`의 `GEMINI_API_KEY`를 사용합니다.
- 샘플 입력: 역명 `강남`, 호선 `2호선`, 광고주 `테스트 광고주`, 날짜 `20260206`
- 출력: `analysisText`, `metrics`, `chartData` 및 전체 JSON

스크립트: `scripts/test-ai-analysis.ts`

### 9.2 웹 페이지 (리포트 형태)

**리포트와 동일한 레이아웃**으로 브라우저에서 확인하려면:

1. 로컬에서 앱 실행: `npm run dev`
2. 브라우저에서 **미리보기 페이지** 접속: [http://localhost:3000/reports/analysis/preview](http://localhost:3000/reports/analysis/preview)

- 해당 페이지가 **Gemini API**를 호출해 샘플 데이터를 생성한 뒤, 실제 리포트와 같은 웹 형태로 렌더링합니다.
- 로그인된 상태(보호 구간)에서만 접근 가능할 수 있으므로, 필요 시 로그인 후 접속하세요.

---

## 10. 체크리스트

- [ ] Google AI Studio에서 API 키 발급
- [ ] `.env.local` / Vercel에 `GEMINI_API_KEY` 설정
- [ ] `npm install @google/genai`
- [ ] `ai-analysis-service.ts`에 Gemini 호출 + JSON 파싱 + Mock 폴백 적용
- [ ] 로컬 테스트: `npm run test:ai-analysis` 로 형태·내용 확인
- [ ] 보고 발송 후 이메일·리포트 페이지에서 분석 문구·지표 확인
- [ ] API 키가 코드/Git에 포함되지 않았는지 확인

---

## 11. 참고 링크

- [Using Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)
- [Gemini API - Libraries (JavaScript)](https://ai.google.dev/gemini-api/docs/libraries)
- [Google AI Studio – API 키](https://aistudio.google.com/app/apikey)
- 프로젝트 내 요약: `vooster-docs/ai-analysis-report-summary.md`
