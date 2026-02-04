# Admate-Vision Supabase 테이블 구조

**프로젝트**: Admate-Vision (한 Supabase 프로젝트에서 두 하위 프로젝트 관리)

| 하위 프로젝트 | 설명 |
|---------------|------|
| **Vision-OCR** | 옥외 광고 게재 현황 자동 보고 (촬영 → OCR → 광고주 매칭) |
| **Vision-DA** | 디지털 온라인 광고 배너 캡처 |

테이블은 `vision_ocr_*`, `vision_da_*` prefix로 구분합니다. 앱 사용자(회원)는 공통 **users** 테이블을 사용합니다.

---

## 공통: 앱 사용자 (회원)

### users

회원가입 시 이름·이메일만 저장. 로그인은 이메일로만 식별.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | text | 이름 (필수) |
| email | text | 이메일 (필수, unique, 로그인 식별자) |
| created_at | timestamptz | 가입 시각 |

- **마이그레이션**: 0004_create_users_table.sql

---

## Vision-OCR (옥외 광고 게재)

### vision_ocr_advertisers

광고주 정보. OCR 매칭 및 캠페인 담당자 연락용.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | text | 광고주명 (필수) |
| email | text | 광고주 이메일 (필수) |
| contact_name | text | 광고주 담당자 이름 (옵션) |
| campaign_manager_name | text | 캠페인 담당자 이름 (필수) |
| campaign_manager_email | text | 캠페인 담당자 이메일 (필수) |
| search_terms | text[] | OCR 매칭용 검색어 목록 |
| created_at, updated_at | timestamptz | |

### vision_ocr_captures

옥외 광고 촬영 기록. 이미지·위치·광고주 매칭 결과 저장용 (향후 촬영 이력·보고 연동).

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| image_storage_path | text | 저장소 이미지 경로 (Supabase Storage 등) |
| lat, lng | double precision | 촬영 위치 |
| address_label | text | 역지오코딩 주소 |
| advertiser_id | uuid | FK → vision_ocr_advertisers(id) |
| ocr_text | text | OCR 추출 텍스트 |
| captured_at, created_at | timestamptz | |

---

## Vision-DA (디지털 온라인 광고 배너 캡처)

### vision_da_campaigns

디지털 광고 캠페인/광고주.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| name | text | 캠페인/광고주명 |
| description | text | 설명 (옵션) |
| created_at, updated_at | timestamptz | |

### vision_da_captures

디지털 배너 캡처 기록.

| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | uuid | PK |
| campaign_id | uuid | FK → vision_da_campaigns(id) |
| screenshot_storage_path | text | 스크린샷 저장 경로 |
| source_url | text | 캡처 시점 URL |
| captured_at, created_at | timestamptz | |

---

## 마이그레이션

- **0001**: example 테이블 (스타터)
- **0002**: `public.advertisers` (구 구조, 필요 시 제거)
- **0003**: `vision_ocr_advertisers`, `vision_ocr_captures`, `vision_da_campaigns`, `vision_da_captures`
- **0004**: `users` (앱 회원: 이름·이메일)

앱 코드는 **vision_ocr_advertisers**, **users**를 사용합니다. 기존에 `advertisers`에 데이터가 있었다면 Supabase SQL Editor에서 이전 후 `advertisers` 테이블을 제거하면 됩니다.
