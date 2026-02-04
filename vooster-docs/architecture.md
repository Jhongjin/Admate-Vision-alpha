# Technical Requirements Document (TRD)

## Admate-Vision Supabase 구조

한 Supabase 프로젝트(Admate-Vision)에서 두 하위 프로젝트를 관리합니다.

- **Vision-OCR**: 옥외 광고 게재 현황 자동 보고 → `vision_ocr_*` 테이블
- **Vision-DA**: 디지털 온라인 광고 배너 캡처 → `vision_da_*` 테이블

테이블 상세: `vooster-docs/supabase-admate-vision-tables.md`

---
  
## Tech Stack

Next.js 15, Hono.js, Supabase, Typescript, Tailwindcss, Shadcn, Lucide-react, @tanstack/react-query, Google Sheets API (for 광고주 정보), Email API (for 이메일 발송)

## Directory Structure


/
├── src/
│   ├── app/                        # Next.js app router
│   │   ├── (protected)/            # protected routes group
│   │   │   └── dashboard/          # dashboard pages
│   │   ├── api/                    # API routes (Hono integration)
│   │   ├── login/                  # auth pages
│   │   ├── signup/                 # auth pages
│   │   └── example/                # example pages
│   ├── backend/                    # server-side logic
│   │   ├── config/                 # backend configuration
│   │   ├── hono/                   # Hono app setup
│   │   ├── http/                   # HTTP utilities
│   │   ├── middleware/             # server middleware
│   │   └── supabase/               # supabase server client
│   ├── components/                 # common components
│   │   └── ui/                     # shadcn/ui components
│   ├── features/                   # feature-based modules
│   │   ├── auth/                   # authentication feature
│   │   │   ├── context/            # auth contexts
│   │   │   ├── hooks/              # auth hooks
│   │   │   ├── server/             # auth server logic
│   │   │   └── types.ts            # auth types
│   │   └── [featureName]/          
│   │       ├── backend/            # backend logic
│   │       ├── components/         # feature components
│   │       ├── pages/              # feature pages
│   │       ├── constants.ts        # feature constants
│   │       ├── types.ts            # feature types
│   │       └── utils.ts            # feature utils
│   │       ├── hooks/              # feature hooks
│   │       └── lib/                # feature utilities
│   ├── constants/                  # global constants
│   ├── hooks/                      # common hooks
│   └── lib/                        # utilities
│       ├── remote/                 # API client
│       ├── supabase/               # supabase client setup
│       └── utils.ts                # shadcn cn utility
├── public/                         # static assets
└── supabase/migrations/            # supabase migrations

  