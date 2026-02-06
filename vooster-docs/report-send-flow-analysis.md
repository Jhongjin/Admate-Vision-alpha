# 보고서 발송 → 이메일 → 목록 이동 프로세스 분석

실제 보고서 연동 시 **보고서 생성 → 이메일 발송 → 보고 목록 이동**이 어떻게 연결되는지 정리했습니다.

---

## 1. 전체 흐름 요약

```
[촬영 확인 페이지] → [보고 발송하기 클릭] → POST /api/capture/report
       → 백엔드: DB 저장 → 이메일 발송 → 200 + { ok, savedToHistory }
       → 프론트: 토스트 "보고 발송 완료" → router.push("/reports")
[보고 목록 페이지] ← GET /api/reports 로 목록 표시
```

---

## 2. 프론트엔드 (촬영 확인 → 발송 → 목록)

| 단계 | 파일 | 동작 |
|------|------|------|
| 1 | `src/app/(protected)/capture/confirm/page.tsx` | 사용자가 **보고 발송하기** 클릭 → `handleSendReport()` 실행 |
| 2 | 동일 | `matchedAdvertiserId` 없으면 토스트 "보고 발송 불가" 후 종료 |
| 3 | 동일 | `setReportSending(true)` 후 `fetch("/api/capture/report", { method: "POST", body: JSON.stringify({ advertiserId, station, line, ... }) })` |
| 4 | 동일 | `res.json()` 파싱 실패 시 토스트 "발송 실패" 후 `return` |
| 5 | 동일 | `res.ok && json.ok` 이면 토스트 "보고 발송 완료", `router.push("/reports")` |
| 6 | 동일 | 그 외는 토스트 "발송 실패" (에러 메시지 표시) |
| 7 | 동일 | `finally` 에서 `setReportSending(false)` |
| 8 | `src/app/(protected)/reports/page.tsx` | `/reports` 진입 시 `useEffect`에서 `fetch("/api/reports")` → 목록 state 갱신 |

**연결 상태**: 확인 페이지의 `fetch` URL(`/api/capture/report`), 성공 시 `router.push("/reports")`, 목록 페이지의 `fetch("/api/reports")` 가 일치하여 **정상 연결**되어 있습니다.

---

## 3. 백엔드 (API → DB → 이메일)

| 단계 | 파일 | 동작 |
|------|------|------|
| 1 | `src/backend/hono/app.ts` | Hono `basePath("/api")` → 라우트 prefix `/api` |
| 2 | `src/features/capture/backend/route.ts` | `app.post("/capture/report", ...)` → 실제 경로 **POST /api/capture/report** |
| 3 | 동일 | `ReportBodySchema` 검증, `advertiserId` 없으면 400 |
| 4 | 동일 | Supabase로 광고주 조회, 없으면 404 |
| 5 | 동일 | (선택) PPT: `includePpt && station && line` 이면 노출량 계산 후 PPT 생성 |
| 6 | 동일 | **AI 분석**: `station && line && advertiserName` 이고 `skipAiAnalysis` 아님 이면 `generateAiAnalysis()` 호출. **55초 타임아웃** 적용 — 초과 시 DB·이메일 진행하지 않고 `AI_ANALYSIS_TIMEOUT` 반환. 클라이언트에서 "다시 시도" 또는 "AI 없이 발송"(`skipAiAnalysis: true`) 선택 시 후자는 AI 건너뛰고 DB·이메일만 진행 |
| 7 | 동일 | **DB 저장**: `vision_ocr_reports` 에 insert (advertiser_id, station, line, ai_analysis 등), `insertedReport.id` 확보 |
| 8 | 동일 | **리포트 URL**: `baseUrl + /reports/analysis/${insertedReport.id}` |
| 9 | 동일 | **이메일 발송**: `sendReportEmail({ ..., reportUrl })` — 본문에 리포트 링크 포함 |
| 10 | 동일 | 이메일 실패 시 500 + `savedToHistory: true` / 성공 시 200 + `ok: true`, `savedToHistory: true` |

**연결 상태**: DB 선저장 → 리포트 URL 생성 → 이메일에 URL 포함 → 클라이언트에 성공/실패 반환까지 **한 흐름으로 연결**되어 있습니다.

---

## 4. 목록 API

| 항목 | 내용 |
|------|------|
| 경로 | **GET /api/reports** (`app.get("/reports", ...)` + basePath `/api`) |
| 응답 | `{ reports: ReportRow[] }` (id, advertiser_name, station, line, sent_at 등) |
| 목록 페이지 | `src/app/(protected)/reports/page.tsx` 에서 `fetch("/api/reports")` 로 사용 |

---

## 5. 정리

- **보고서 생성**: POST /api/capture/report 에서 DB insert 후 `insertedReport.id` 로 리포트 생성 완료.
- **이메일 발송**: 같은 요청 내에서 `reportUrl` 포함해 `sendReportEmail()` 호출.
- **목록 이동**: 성공 시 프론트에서 `router.push("/reports")` 로 이동, 목록 페이지는 GET /api/reports 로 최신 목록 표시.

역명(위치)이 없는 보고서는 백엔드에서 `ai_analysis` 를 생성하지 않으며, 목록에서는 **역명이 있는 경우에만** "AI 분석" 버튼이 보이도록 처리되어 있습니다.

---

## 6. Gemini와 발송 완료 시점

- **순서(이미 그렇게 동작함)**: 사용자가 "보고서 발송" 클릭 시, 백엔드는 **DB·이메일을 아직 실행하지 않고** 먼저 **Gemini만 호출**해 AI 보고서를 생성합니다. **Gemini가 보고서 생성 완료 응답을 주면**, 그때 백엔드에서 **이후 프로세스(DB 저장 → 이메일 발송)** 를 진행합니다. 즉 "Gemini 완료 → 그다음 DB·이메일" 순서가 맞고, 한 번의 HTTP 요청 안에서 `await generateAiAnalysis()` 로 기다린 뒤 `insert`·`sendReportEmail()` 을 호출합니다.
- **타임아웃이 필요한 이유**: 위 흐름은 한 요청이 **Gemini 대기 + DB + 이메일** 전부를 처리합니다. 서버리스(예: Vercel)는 **요청당 실행 시간 한도**(예: 60초)가 있어서, Gemini가 60초 넘게 걸리면 **그 요청 전체가 강제 종료**됩니다. 그 시점에는 아직 DB·이메일 단계에 도달하지 못했으므로 **DB 저장·이메일이 실행되지 않습니다**. 그래서 "최대 55초까지만 기다리고, 안 되면 사용자에게 선택(다시 시도 / AI 없이 발송)을 주는" 타임아웃이 필요합니다.
- **타임아웃**: Gemini 호출에 **55초** 타임아웃을 두어, 서버리스 한도(60초) 내에서 최대한 대기합니다. 55초 안에 완료되지 않으면 DB·이메일을 진행하지 않고 **AI_ANALYSIS_TIMEOUT** 을 반환합니다.
- **사용자 선택**: 클라이언트에서 해당 응답 시 "AI 성과 분석 생성 시간 초과" 시트를 띄우고, **다시 시도** 또는 **AI 없이 발송** 중 선택하게 합니다. "AI 없이 발송" 시 `skipAiAnalysis: true` 로 재요청하여 AI 없이 DB 저장·이메일만 진행합니다.
- **클라이언트**: 발송 요청에 **90초** 타임아웃을 두어, 서버가 응답하지 않으면 "요청이 시간 초과되었습니다" 토스트를 띄웁니다.

---

## 7. 타임아웃이 필요한 이유 / 메일이 안 갔던 이유

- **서버리스 실행 한도**: Vercel 등에서 API는 **함수 실행 시간 제한**(예: Hobby 10초, Pro 60초) 안에 끝나야 합니다. 이 시간을 넘기면 **함수가 강제 종료**되고, 그 시점까지 한 DB 저장·이메일 발송이 없으면 **저장·발송이 아예 되지 않습니다**. 클라이언트는 응답을 못 받아 "발송중"만 보이거나, 나중에 타임아웃/연결 끊김으로 실패로 보이게 됩니다.
- **메일이 안 갔던 이유**: 흐름이 **Gemini 호출 → DB 저장 → 이메일** 순서라서, **Gemini 응답이 늦어지면** 전체 요청 시간이 서버리스 제한을 넘기기 쉽습니다. 그렇게 되면 **함수가 Gemini 대기 중에 종료**되고, DB 저장·이메일 단계까지 도달하지 못해 **메일이 발송되지 않고, 목록에도 안 뜨는** 상황이 됐을 가능성이 큽니다.
- **지연될 수 있는 이유**: Gemini API 쪽 **네트워크 지연**, **Google 측 부하·큐잉**, **첫 요청 시 콜드스타트**, **응답 생성 시간** 등으로 5~15초 이상 걸릴 수 있습니다. 환경에 따라 10초를 넘기면 Vercel Hobby에서 이미 함수가 종료될 수 있습니다.
- **타임아웃을 두는 이유**: (1) **제한 시간 안에** “AI 실패”를 판단하고, (2) **그 전에** 사용자에게 "다시 시도 / AI 없이 발송"을 선택하게 해서, **DB·이메일은 반드시 실행되게** 하기 위함입니다. 55초까지는 기다렸다가, 안 되면 응답을 보내고 사용자가 "AI 없이 발송"을 선택하면 `skipAiAnalysis` 로 DB·이메일만 수행합니다.
