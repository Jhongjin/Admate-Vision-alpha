# Vercel 배포 가이드

스마트폰에서 HTTPS URL로 카메라 테스트하려면 Vercel에 배포하면 됩니다.

---

## 1. 저에게 줄 정보

**필요 없습니다.** Vercel 계정·비밀번호·토큰 등을 공유하지 마세요.  
배포는 본인 Vercel 계정에서 Git 저장소만 연결해 진행하면 됩니다.

---

## 2. Vercel에서 할 일

### 2.1 저장소를 GitHub 등에 올리기

- 프로젝트를 GitHub(또는 GitLab, Bitbucket)에 푸시해 두세요.

### 2.2 Vercel에 프로젝트 만들기

1. [vercel.com](https://vercel.com) 접속 후 로그인
2. **Add New…** → **Project**
3. **Import Git Repository**에서 해당 저장소 선택
4. **Framework Preset**: Next.js (자동 감지됨)
5. **Root Directory**: 비워 두기 (프로젝트 루트가 맞다면)
6. **Environment Variables**:  
   - **지금은 비워 두고 배포해도 됩니다.**  
   - 이메일 등록(쿠키)·카메라 테스트는 환경 변수 없이 동작합니다.  
   - 나중에 Supabase를 쓸 때만 아래 두 개 추가하면 됩니다.

   | Name | Value |
   |------|--------|
   | `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
   | `SUPABASE_URL` | Supabase 프로젝트 URL (동일) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service_role key |
   | `GOOGLE_CLOUD_VISION_API_KEY` | (선택) Google Cloud Vision API 키 |

   **중요**: 각 변수 추가 시 **Environments**에서 **Production**을 반드시 체크하세요. (Preview만 체크하면 프로덕션 배포 시 변수가 주입되지 않습니다.)  
   환경 변수 추가/수정 후에는 **새 배포**를 해야 반영됩니다. (기존 배포에는 적용되지 않음.)

7. **Deploy** 클릭

### 2.3 배포 후 URL

- 배포가 끝나면 `https://<프로젝트명>-<팀명>.vercel.app` 형태의 URL이 생깁니다.
- 이 URL을 스마트폰 브라우저에 입력하면 HTTPS로 접속할 수 있고, 카메라 권한 허용 후 촬영 화면을 테스트할 수 있습니다.

---

## 3. 요약

| 구분 | 내용 |
|------|------|
| 저에게 줄 정보 | 없음 (Vercel 계정/토큰 공유 불필요) |
| Vercel에서 할 일 | Git 저장소 연결 → Deploy (환경 변수 없이 가능) |
| 스마트폰 테스트 | 배포된 `https://...vercel.app` 주소로 접속 |

추가로 Vercel 팀 초대, 커스텀 도메인 등이 필요하면 Vercel 대시보드에서 설정하면 됩니다.

---

## 4. 배포가 안 될 때 / 환경 변수가 적용 안 될 때

- **빌드 로그에 "SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY 없음"** 이 보이면, Vercel 빌드 시점에 환경 변수가 주입되지 않은 상태입니다.
- **확인 사항**
  1. **Settings → Environment Variables**에서 각 변수에 **Production** 체크가 되어 있는지 확인.
  2. **Deployments** 탭에서 최신 배포 선택 → **⋯** → **Redeploy** → (가능하면 "Use existing Build Cache" 해제 후) 재배포.
  3. **Git 푸시로 배포**하는 경우: **Settings → Git**에서 연결된 저장소·Production 브랜치가 맞는지 확인. `main` 등에 푸시 시 자동 배포가 트리거되는지 확인.
- **CLI 배포** (`npx vercel --prod`)는 로컬 파일을 업로드해 배포합니다. 환경 변수는 Vercel 프로젝트에 설정된 값이 빌드/런타임에 사용됩니다. 변수 수정 후에는 다시 `npx vercel --prod`로 재배포하면 됩니다.
