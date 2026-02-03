# Technical Specification: Advertisement Capture & Recognition

옥외 광고 게재 현황 자동 보고 툴 — 광고 촬영 및 인식 기능 기술 명세

본 문서는 프론트엔드·백엔드 엔지니어가 광고 촬영·인식·보고 플로우를 구현할 때 참고하는 기술 명세이다.

---

## 1. User Journey

사용자 흐름은 아래와 같이 연결된다.

```
Visit Site → Open Camera Interface → Capture Photo → Preview & Confirm → Automatic Recognition → View Results → Send Email Report
```

단계별 설명:

| 단계 | 설명 |
|------|------|
| **Visit Site** | 루트(/) 또는 대시보드에서 서비스 진입 |
| **Open Camera Interface** | 촬영 화면(/capture)에서 카메라 UI 표시(autofocus, 그리드 등) |
| **Capture Photo** | 사용자가 촬영 버튼으로 사진 촬영 |
| **Preview & Confirm** | 촬영 이미지 미리보기, 재촬영 또는 다음 단계 선택 |
| **Automatic Recognition** | 서버/클라이언트에서 OCR·광고주 인식 수행 |
| **View Results** | 인식 결과(광고주명, 위치 등) 표시, 사용자 검토·수정 |
| **Send Email Report** | 최종 확인 후 이메일 보고 발송 |

---

## 2. Functional Requirements

### 2.1 카메라·촬영

- The camera interface must support **autofocus** and **grid overlay** for stable framing.
- The camera must capture still images in a format suitable for OCR (e.g. JPEG/PNG, minimum resolution defined by product).
- The app must request and handle camera permissions (getUserMedia or native equivalent) and degrade gracefully when access is denied.
- The user must be able to retake the photo from the preview step before proceeding to recognition.

### 2.2 인식(Recognition)

- The recognition engine must identify the **advertiser name** with **≥95% accuracy** (per release criteria).
- OCR (optical character recognition) must extract text from the captured image; the output must include confidence scores for downstream matching.
- The recognition module must map extracted text (or structured data) to a canonical **advertiser identifier** and **advertiser name** (e.g. from Google Sheets or internal DB).
- When recognition confidence is below a defined threshold, the system must surface the result as “unverified” and allow the user to correct or select the advertiser manually.

### 2.3 위치 정보

- **GPS coordinates** must be captured at the time of capture (or at confirm step) and **attached to the image metadata** (e.g. EXIF or separate payload).
- Location data must include at least: latitude, longitude, and optionally accuracy/timestamp.
- The user must be able to **view** the captured location on the confirm screen; editing of coordinates may be optional and documented.

### 2.4 검토·발송

- The user **can review and edit recognized data** (advertiser name, location, attached image) **before sending** the report.
- The confirm screen must display: captured image, recognized advertiser (id + name), location (coordinates and/or address if available).
- The user must explicitly trigger “Send report”; the system must not auto-send without confirmation.
- After send, the system must persist the report record (e.g. in Supabase) and trigger the email service with the agreed payload.

### 2.5 이메일·저장

- The email service must receive a well-defined payload (image attachment, location, advertiser, report id) and send the outbound email to the advertiser’s contact (e.g. from Google Sheets or DB).
- Captured image and metadata must be stored in a durable store (e.g. Supabase Storage + DB) for audit and resend capability.

---

## 3. Data Flow

### 3.1 흐름 다이어그램(텍스트)

```
[Photo Capture] Image Blob (file)
       →
[Client] Append GPS + timestamp → Payload { imageBlob, lat, lng, capturedAt }
       →
[API] Upload image → Storage → get image URL
       →
[OCR Service] Image URL (or Blob) → JSON { text, confidence, blocks? }
       →
[Recognition Module] { text, confidence } + Advertiser DB/Sheet → { advertiserId, advertiserName, confidence }
       →
[Storage] Save report row: { reportId, imageUrl, lat, lng, advertiserId, advertiserName, userId, status }
       →
[Email Service] Payload { reportId, imageUrl, advertiserId, advertiserName, recipientEmail, location } → Outbound Email
       →
[User] View Results (report list / success screen)
```

### 3.2 단계별 데이터 페이로드

- **Photo Capture (Client)**  
  - **Input:** Camera stream / captured file.  
  - **Output:** Image Blob (or File), e.g. `image/jpeg` / `image/png`.  
  - **Key fields:** `file`, `type`, `size`.

- **Client → API (Upload)**  
  - **Payload:** `FormData` or JSON with base64/URL.  
  - **Key fields:** `image` (file or URL), `lat` (number), `lng` (number), `capturedAt` (ISO 8601), optional `accuracy`.  
  - **Format example:** `{ "lat": 37.5665, "lng": 126.9780, "capturedAt": "2026-02-03T12:00:00Z", "image": "<file|url>" }`.

- **OCR Service**  
  - **Input:** Image URL or binary.  
  - **Output:** `{ "text": string, "confidence": number, "blocks"?: Array<{ text, confidence, bbox? }> }`.  
  - **Format:** JSON; `confidence` 0–1 or percentage; optional `blocks` for region-wise results.

- **Recognition Module**  
  - **Input:** OCR output + advertiser list (from Google Sheets or DB).  
  - **Output:** `{ "advertiserId": string, "advertiserName": string, "confidence": number }`.  
  - **Format:** JSON; matching rules (e.g. fuzzy match, threshold) are implementation-defined; low confidence may return `advertiserId: null` and prompt user selection.

- **Storage (Report row)**  
  - **Key fields:** `id` (UUID), `image_url` (string), `lat`, `lng` (number), `advertiser_id`, `advertiser_name`, `user_id`, `status` (e.g. "pending" | "sent"), `created_at`, optional `recipient_email`, `sent_at`.  
  - **Format:** DB schema (e.g. Supabase table); image file in Supabase Storage, `image_url` as public or signed URL.

- **Email Service**  
  - **Input:** `{ "reportId": string, "imageUrl": string, "advertiserId": string, "advertiserName": string, "recipientEmail": string, "location": { "lat": number, "lng": number } }`.  
  - **Output:** Sent email (implementation depends on Email API); update report `status` to "sent", set `sent_at`.

- **View Results**  
  - **Data:** Report list from Storage (filter by `user_id`, order by `created_at`); each item includes image URL, location, advertiser, status, timestamps.  
  - **Format:** API returns array of report objects; frontend displays in list/detail per UI spec.

---

## 4. Cross-cutting Notes

- **Auth:** 모든 보호 구간(촬영, 확인, 보고 목록)은 인증된 사용자만 접근; `user_id`는 서버에서 세션/토큰으로 결정한다.
- **Error handling:** OCR/Recognition 실패 시 사용자에게 메시지 표시 및 재시도 또는 수동 입력 유도.
- **Frontend:** 카메라(브라우저는 getUserMedia), GPS (Geolocation API), 폼 검증(zod), API 호출(React Query 등)은 프로젝트 가이드라인에 맞춘다.
- **Backend:** Hono API에서 업로드·OCR 호출·Recognition·Storage·Email 연동 순서로 파이프라인 구현; Google Sheets API는 광고주 정보 조회용으로 TRD에 명시된 대로 사용한다.

이 명세는 구현 가이드용이며, 실제 스키마·API 경로·환경 변수는 코드와 TRD/architecture에 맞춰 구체화한다.
