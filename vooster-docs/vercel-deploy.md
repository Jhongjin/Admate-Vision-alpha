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
