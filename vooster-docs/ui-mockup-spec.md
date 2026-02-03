# UI Mockup Specification

옥외 광고 게재 현황 자동 보고 툴 — Core User Flows (UI-only)

---

## 1. Product Summary

**옥외 광고 게재 현황 자동 보고 툴**은 옥외 광고 운영 담당자가 스마트폰으로 광고를 촬영하고, 광고주를 자동 인식하며, 위치 정보를 기록한 뒤 광고주 담당자에게 이메일로 자동 보고하는 업무 자동화 도구이다. 본 문서는 광고 촬영·확인·보고 흐름에 대한 UI 전용 목업 명세이다.

---

## 2. Target Users

**Persona: 옥외 광고 운영 담당자**

- **역할:** 현장에서 옥외 광고물을 점검하고 광고주에게 게재 현황을 보고하는 담당자
- **목표:** 촬영 → 인식 → 위치 기록 → 이메일 발송까지 시간 단축, 정확하고 신속한 보고
- **환경:** 스마트폰 중심 사용, 이동 중 단순·빠른 조작 선호
- **니즈:** 카메라 촬영, 자동 인식 결과 확인, 한 번에 보고 발송

---

## 3. Design Mood

- **Keywords:** 신속, 정확, 단순, 신뢰, 업무 도구
- **Tone:** 전문적이면서 부담 없는 UI, 불필요한 장식 최소화
- **Visual references:** 카드 기반 레이아웃, 명확한 CTA, 모바일 퍼스트

---

## 4. Color Palette

T-001 디자인 토큰을 따른다.

- **Primary:** primary-400/500 — 메인 CTA, 네비게이션
- **Secondary:** secondary-50~500 — 카드, 패널, 보조 텍스트
- **Accent:** accent-400/500 — 강조, 성공/정보 배지
- **Grayscale:** gray-50~900 — 배경·테두리·본문

자세한 값은 `vooster-docs/design-tokens.md` 참조.

---

## 5. UI Guidelines

- **Spacing:** 4px 기준 그리드(4, 8, 12, 16, 24, 32, 48px). 섹션 간 24~32px, 카드 내부 16px.
- **Grid:** 모바일 1열, 태블릿 2열, 데스크톱 12열 그리드. 컨테이너 max-width 1400px.
- **Iconography:** lucide-react 사용. 크기 16~24px, secondary-500 또는 primary-500.
- **Button styles:** Primary = primary-500 배경; Secondary = secondary-200 테두리; Destructive = destructive. 높이 40~44px, 패딩 12~16px.

---

## 6. User Journey

```
방문(/) → 로그인(/login) → 대시보드(/dashboard) → 카메라 열기(/capture) → 촬영 → 확인(/capture/confirm) → 보고 발송 → 보고 목록(/reports)
```

텍스트 흐름:

1. **Visit Site** — 루트(/)에서 서비스 소개 및 로그인/회원가입 진입
2. **Login** — /login에서 인증 후 대시보드로 리다이렉트
3. **Dashboard** — /dashboard에서 현황 요약 및 “촬영하기” 진입
4. **Open Camera** — /capture에서 카메라(목업) UI 표시
5. **Capture** — 촬영 버튼으로 캡처(더미) 수행
6. **Confirm** — /capture/confirm에서 촬영본·위치·광고주(더미) 확인
7. **Send Report** — “보고 발송” 후 완료
8. **Reports** — /reports에서 발송 이력(더미) 조회

---

## 7. Common Components

- **Header:** 로고/서비스명, 네비(대시보드, 촬영, 보고 목록), 로그아웃
- **Footer:** 서비스명, 간단 링크(선택)
- **Card:** secondary-100 배경, secondary-200 테두리, radius-lg
- **Modal:** 확인/알림용 (확인, 취소)
- **Button:** Primary / Secondary / Ghost (shadcn-ui Button)
- **Badge:** 상태 표시(발송 완료, 대기 등) — accent 또는 primary

---

## 8. Sitemap

| Path | Role | 설명 |
|------|------|------|
| / | 공개 | 랜딩, 로그인/회원가입 링크 |
| /login | 공개 | 로그인 |
| /signup | 공개 | 회원가입 |
| /dashboard | 로그인(Operator/Admin) | 대시보드, 촬영/보고 목록 진입 |
| /capture | 로그인(Operator) | 촬영 화면(카메라 목업) |
| /capture/confirm | 로그인(Operator) | 촬영 확인 및 보고 발송 |
| /reports | 로그인(Operator) | 보고 발송 이력 목록 |

---

## 9. Page Implementations

### 9.1 루트 (/)

- **Core Purpose:** 서비스 소개 및 로그인/회원가입 진입
- **Key Components:** Hero, CTA(로그인/회원가입), Footer
- **Layout:** header(로고/네비) — content(히어로·CTA) — footer

### 9.2 대시보드 (/dashboard)

- **Core Purpose:** 현황 요약, 촬영·보고 목록 진입
- **Key Components:** Header, Card(오늘 촬영 수, 발송 수), 버튼(촬영하기, 보고 목록)
- **Layout:** header — content(카드 그리드) — (footer 선택)

### 9.3 촬영 (/capture)

- **Core Purpose:** 카메라 UI로 광고 촬영(목업)
- **Key Components:** Header, 카메라 프리뷰(더미/플레이스홀더), 촬영 버튼
- **Layout:** header — full-width 카메라 영역 — 하단 고정 촬영 버튼

### 9.4 촬영 확인 (/capture/confirm)

- **Core Purpose:** 촬영 이미지·위치·광고주(더미) 확인 후 보고 발송
- **Key Components:** Header, Card(이미지, 위치, 광고주), 버튼(발송, 취소)
- **Layout:** header — content(카드) — 액션 버튼

### 9.5 보고 목록 (/reports)

- **Core Purpose:** 발송 이력(더미) 목록 조회
- **Key Components:** Header, 테이블/리스트(날짜, 광고주, 위치, 상태)
- **Layout:** header — content(리스트) — (footer 선택)

---

## 10. Layout Components

| Route group | Applicable routes | Core components | Responsive |
|-------------|-------------------|-----------------|------------|
| Public | /, /login, /signup | Header(로고, 로그인/회원가입), Footer | Mobile: 1열, Desktop: container |
| Protected | /dashboard, /capture, /capture/confirm, /reports | Header(로고, 대시보드/촬영/보고목록, 로그아웃) | Mobile: 하단 네비 권장, Tablet+: 상단 네비 |

- **Mobile:** 단일 컬럼, 터치 타겟 44px 이상, 하단 액션 고정 가능
- **Tablet:** 2열 그리드, 카드 정렬
- **Desktop:** container max-width 1400px, 12열 그리드
