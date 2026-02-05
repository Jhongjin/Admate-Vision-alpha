# Resend 메일 사용 + Vercel API 키 등록 프로세스

AdMateVision 보고 발송 기능에서 이메일 전송에 **Resend**를 사용합니다.  
Vercel에 API 키를 등록하는 절차입니다.

---

## 1. Resend 가입 및 API 키 발급

### 1.1 가입

1. [resend.com](https://resend.com) 접속 후 **Sign up** (이메일 또는 Google 등).
2. 로그인 후 대시보드에서 **API Keys** 메뉴로 이동.

### 1.2 API 키 생성

1. **Create API Key** 클릭.
2. **Name**: 예) `admate-vision-production`
3. **Permission**: **Sending access** (발송만 필요하면 이 권한으로 충분).
4. **Create** 후 표시되는 키를 **한 번만** 복사해 안전한 곳에 보관.  
   (다시 볼 수 없으므로 잃어버리면 새로 발급해야 함.)

### 1.3 도메인 인증 (발신 주소용)

- Resend에서 **이메일 발송**을 하려면 **From 주소의 도메인**을 인증해야 합니다.
- **Domains** → **Add Domain** → 사용할 도메인 입력 (예: `yourcompany.com`).
- Resend가 안내하는 **DNS 레코드**(SPF, DKIM 등)를 **그 도메인의 DNS 관리 페이지**에 추가해야 합니다.
- 인증 완료 후 해당 도메인의 주소(예: `noreply@yourcompany.com`)를 **From**으로 사용할 수 있습니다.

**Vercel 프로덕트 주소로는 인증 불가**

- `admate-vision-alpha.vercel.app` 같은 **Vercel 앱 주소**는 “웹사이트 URL”이지, “이메일 발신 도메인”이 아닙니다.
- Resend 도메인 인증은 **이메일 @ 뒤의 도메인**(예: `noreply@xxx.com`의 `xxx.com`)에 SPF/DKIM DNS를 넣어야 하는데, `vercel.app`은 Vercel이 소유한 도메인이라 **본인이 DNS 레코드를 추가할 수 없습니다.**  
  → 따라서 **`*.vercel.app`으로는 Resend 도메인 인증을 할 수 없습니다.**

**가능한 방법**

- **테스트**: Resend 기본 도메인 `onboarding@resend.dev` 사용 (수신 제한 있을 수 있음). 별도 도메인 인증 없이 발송 가능.
- **프로덕션**: **본인/회사가 DNS를 관리하는 도메인**(예: `nasmedia.co.kr`, `yourcompany.com`)을 Resend에 추가하고, 해당 도메인의 DNS에 SPF/DKIM 레코드를 넣어 인증한 뒤, 그 도메인으로 From 주소(예: `noreply@nasmedia.co.kr`)를 사용하면 됩니다.

---

## 2. Vercel에 API 키 등록

### 2.1 환경 변수 추가

1. [vercel.com](https://vercel.com) 로그인 → **admate-vision-ocr** 프로젝트 선택.
2. 상단 **Settings** → 왼쪽 **Environment Variables**.
3. **Add New**:
   - **Key**: `RESEND_API_KEY`
   - **Value**: 1.2에서 복사한 Resend API 키
   - **Environments**: **Production** (필요 시 Preview도 체크)
4. **Save** 클릭.

### 2.2 발신 전용 주소 (선택)

- 프로덕션에서 사용할 발신 주소(예: `noreply@yourdomain.com`)가 있으면:
  - **Key**: `RESEND_FROM_EMAIL`  
  - **Value**: `나스미디어 보고 <noreply@yourdomain.com>` 형태  
  - 위와 같이 추가해 두면, 코드에서 이 값을 읽어 **From**으로 사용할 수 있습니다.
- 미설정 시 코드 내 기본값(예: `onboarding@resend.dev` 또는 도메인 인증된 주소) 사용.

### 2.3 배포 반영

- 환경 변수는 **저장 시점 이후의 새 배포**에만 적용됩니다.
- **보고 발송이 동작하지 않을 때**: `RESEND_FROM_EMAIL`이 **인증 완료한 도메인** 주소인지 확인하세요 (예: `나스미디어 보고 <noreply@admate.ai.kr>`). 변수 추가/수정 후 **Redeploy**를 한 번 실행해야 적용됩니다.
- **Deployments** → 최신 배포 **⋯** → **Redeploy** 로 한 번 다시 배포하면 새 값이 적용됩니다.

---

## 3. 로컬 개발 (.env.local)

로컬에서도 보고 발송을 테스트하려면:

1. 프로젝트 루트 `.env.local` 파일에 다음 추가:
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxx
   # 선택
   RESEND_FROM_EMAIL=나스미디어 보고 <noreply@yourdomain.com>
   ```
2. `.env.local`은 Git에 올리지 않도록 이미 `.gitignore`에 포함되어 있는지 확인.

---

## 4. 요약

| 단계 | 내용 |
|------|------|
| Resend | 가입 → API Keys에서 키 생성 → (선택) 도메인 인증 |
| Vercel | Settings → Environment Variables → `RESEND_API_KEY` 추가 → Production 체크 → Save |
| 배포 | 변수 추가/수정 후 Redeploy 한 번 실행 |
| 로컬 | `.env.local`에 `RESEND_API_KEY`(및 필요 시 `RESEND_FROM_EMAIL`) 추가 |

이후 앱의 **보고 발송하기**는 이 API 키를 사용해 Resend로 이메일을 보냅니다.
