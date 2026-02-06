# AdMate Vision Alpha: AI 성과 분석 및 리포트 기능 구현 요약

지금까지 진행된 AI 성과 분석 리포트 통합 및 UI 개선 작업의 전체 내역입니다. Cursor나 다른 개발자가 이어서 작업할 때 참고할 수 있도록 주요 변경 사항과 핵심 파일, 로직을 정리했습니다.

---

## 1. 핵심 기능: AI 성과 분석 리포트 (AI Analysis Report)

촬영된 지하철 광고에 대해 AI가 유동인구, 타겟층, 효율 점수 등을 분석하고, 이를 웹 리포트 형태로 생성하여 이메일로 발송하는 기능입니다.

### 🔄 전체 프로세스 (Workflow)

1. **촬영 및 전송**: 사용자가 광고 촬영 후 [보고 발송] 클릭.
2. **데이터 생성 (Backend)**:
   - `station`(역명), `line`(호선), `advertiserName` 정보를 기반으로 AI 분석(Mock) 실행.
   - 분석 데이터(`ai_analysis` JSON)를 포함하여 DB(`vision_ocr_reports`)에 **선 저장**.
   - 생성된 Report ID를 이용해 웹 리포트 URL 생성 (`/reports/analysis/[id]`).
3. **이메일 발송**: 생성된 리포트 URL을 이메일 본문에 포함하여 광고주/담당자에게 전송.
4. **웹 리포트 조회**: 수신자가 링크 클릭 시, 저장된 AI 분석 데이터를 기반으로 동적 리포트 페이지 렌더링.

---

## 2. 주요 변경 코드 및 파일 (Development Context)

### 📂 Backend (API & Service)

| 파일 | 변경 내용 |
|------|-----------|
| `src/features/capture/backend/route.ts` | **순서 변경**: 이메일 발송 전에 DB Insert를 먼저 수행(Report ID 확보). **데이터 조인**: `/reports/:id`에서 `vision_ocr_advertisers` 조인하여 캠페인 담당자 정보 포함. **AI 연동**: `generateAiAnalysis` 호출 추가. |
| `src/features/capture/backend/ai-analysis-service.ts` | **신규**. AI 분석 Mock 구현. `generateAiAnalysis`: 역명·호선 입력 → `analysisText`, `metrics`(트래픽·점수), `chartData` 반환. 실제 LLM(Gemini) 연동 시 이 파일만 수정. |
| `src/features/capture/backend/report-email.ts` | `ReportEmailParams`에 `reportUrl` 추가. 이메일 본문에 리포트 링크 있으면 하단에 [AI 성과 분석 리포트 확인하기] 링크 추가. |
| `supabase/migrations/0006_add_ai_analysis_to_reports.sql` | `vision_ocr_reports` 테이블에 `ai_analysis` (JSONB) 컬럼 추가. |

### 🎨 Frontend (UI/UX)

| 파일 | 변경 내용 |
|------|-----------|
| `src/app/(protected)/reports/analysis/[id]/page.tsx` | **신규**. 동적 라우팅으로 `id`로 리포트·AI 데이터 fetch. **레이아웃**: 상단 2단 그리드(좌: AI 텍스트/차트, 우: AdMate Score/원형 차트), 중단 Full Width "현장 촬영 증빙", 하단 Footer(담당자 정보·Disclaimer). 프린트 최적화(`print:hidden` 등). |
| `src/app/(protected)/reports/page.tsx` | [AI 분석] 클릭 시 샘플 대신 실제 동적 URL `/reports/analysis/${id}` 로 이동하도록 링크 수정. |
| `src/app/(protected)/capture/confirm/page.tsx` | 옵션 라벨: "PPT 포함" → "AI 성과 분석 리포트 생성 (이메일에 링크 포함)". |

---

## 3. Cursor / 개발자 참고 사항 (To-Do)

이 문맥을 유지하며 다음 작업을 진행할 때 참고하세요.

| 항목 | 설명 |
|------|------|
| **AI 모델 연동** | `ai-analysis-service.ts`는 현재 더미 데이터 반환. 실제 운영 시 Google Gemini API 등 호출로 교체. |
| **이미지 연동 (Visual Proof)** | "현장 촬영 증빙" 섹션은 플레이스홀더(Unsplash) 사용 중. 실제 촬영본 표시를 위해: 촬영 시 Supabase Storage 등에 업로드 → URL을 `vision_ocr_reports`에 저장하거나, 리포트 페이지에서 해당 이미지 불러오는 로직 추가. |
| **데이터 정확도** | 하단 Disclaimer("서울교통공사 데이터 기반 추정치")에 맞춰 `report-exposure/public-data-service.ts` 등 공공데이터 API 연동 강화. |

---

## 4. OCR 인식률 개선 옵션 (차기 작업 참고)

### 방법 1. 기존 코드 개선 (즉시 적용 가능)

- **DOCUMENT_TEXT_DETECTION 모드**: 현재 `TEXT_DETECTION`(표지판·짧은 글씨) → `DOCUMENT_TEXT_DETECTION`(문서·밀집 텍스트)로 변경 시 지하철 광고판 인식에 유리할 수 있음.
- **언어 힌트**: API 요청 시 `imageContext`에 `languageHints: ["ko", "en"]` 추가.

### 방법 2. 이미지 전처리 (Pre-processing)

- 흑백·이진화로 대비 강화, 리사이징(긴 쪽 2000px 등). 브라우저에서는 `browser-image-compression` 등 라이브러리 활용.

### 방법 3. Gemini 1.5 Flash 사용 (강력 추천 ⭐)

- OCR 대신 **Vision AI** 사용. `runGoogleVisionOcr` → `runGeminiVision` 교체.
- 프롬프트 예: "이 이미지에 있는 지하철 역 이름과 광고주 이름을 json으로 추출해줘."
- 기울기·반사·스타일 폰트에도 맥락 이해로 인식률 향상. 비용은 Gemini 1.5 Flash 기준 OCR API와 비슷하거나 저렴할 수 있음.

---

## 5. 최근 업데이트 요약 테이블

| 구분 | 주요 변경 사항 | 관련 파일 |
|------|----------------|-----------|
| Backend | AI 성과 분석 로직 추가. 보고 발송 시 AI 데이터 생성 및 DB 선저장. Mock AI Service(트래픽·점수 추정). 이메일에 웹 리포트 URL 자동 포함. | `src/features/capture/backend/route.ts`, `ai-analysis-service.ts`, `report-email.ts` |
| DB | Report 테이블 확장. `ai_analysis` 컬럼(JSONB) 추가. | `supabase/migrations/0006_add_ai_analysis_to_reports.sql` |
| Frontend | 동적 웹 리포트 페이지. `/reports/analysis/[id]` 라우트. 2열 그리드(좌: 분석/차트, 우: 스코어). 현장 증빙 이미지 Full-Width. Footer: 담당자 정보·Disclaimer. | `src/app/(protected)/reports/analysis/[id]/page.tsx` |
| UX | 확인 페이지 옵션 명 변경("PPT 포함" → "AI 리포트 링크 포함"). 보고 목록 [AI 분석] 클릭 시 동적 페이지로 이동. | `src/app/(protected)/capture/confirm/page.tsx`, `src/app/(protected)/reports/page.tsx` |

---

## 👨‍💻 차기 작업자(Cursor)를 위한 가이드

- **AI Service**: `ai-analysis-service.ts`는 Mock. 실제 운영 시 Gemini API 호출로 교체.
- **Visual Proof**: `route.ts` 이메일 발송 로직과 저장 로직 사이에, 실제 업로드된 이미지 URL을 DB에 저장하는 파이프라인 추가 필요. (현재 Mock 이미지 사용)
- **OCR Upgrade**: `ocr-service.ts`를 Gemini Vision 기반으로 업그레이드하면 인식률 개선 가능.
