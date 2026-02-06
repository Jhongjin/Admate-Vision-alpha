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
| 6 | 동일 | **AI 분석**: `station && line && advertiserName` 이면 `generateAiAnalysis()` 호출, 실패 시 로그만 하고 `ai_analysis: null` 로 저장 |
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
