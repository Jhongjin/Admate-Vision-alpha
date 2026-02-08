# AdMate Vision OOH - Favicon & PWA Icons

## 📦 생성된 파일 목록

### 파비콘 (Favicon)
- `favicon.ico` - 멀티 사이즈 ICO 파일 (16x16, 32x32, 48x48)
- `favicon-16x16.png` - 16×16 PNG
- `favicon-32x32.png` - 32×32 PNG

### Apple 기기용
- `apple-touch-icon.png` - 180×180 PNG (iOS 홈 화면)

### PWA 아이콘
- `icon-192x192.png` - 192×192 PNG (Android 홈 화면)
- `icon-512x512.png` - 512×512 PNG (고해상도/스플래시)

### PWA 설정
- `manifest.json` - PWA 매니페스트 파일

---

## 💻 HTML 구현 코드

웹사이트의 `<head>` 섹션에 다음 코드를 추가하세요:

```html
<!-- Favicon -->
<link rel="icon" type="image/x-icon" href="/favicon.ico">
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">

<!-- PWA Manifest -->
<link rel="manifest" href="/manifest.json">

<!-- Theme Color (주소창 색상) -->
<meta name="theme-color" content="#FF6B8A">

<!-- Apple Mobile Web App -->
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="AdMate">
```

---

## 📱 PWA 설치 안내

### iOS (Safari)
1. Safari로 웹사이트 접속
2. 하단 공유 버튼 탭
3. "홈 화면에 추가" 선택
4. "추가" 탭

### Android (Chrome)
1. Chrome으로 웹사이트 접속
2. 우상단 메뉴(⋮) 탭
3. "앱 설치" 또는 "홈 화면에 추가" 선택
4. "설치" 탭

---

## 🎨 디자인 특징

- **색상**: 코랄 핑크 → 로즈 그라데이션 (#FF6B8A 계열)
- **배경**: 완전 투명 (PNG 알파 채널)
- **요소**: 
  - 카메라 아이콘 (현장 촬영)
  - 빌보드 + 눈 심볼 (비전/모니터링)
  - "AdMate Vision OOH" 텍스트
- **스타일**: 친근하고 전문적, 현대적

---

## 📂 파일 배치 가이드

Next.js 프로젝트의 경우 `public/` 폴더에 모든 아이콘 파일을 배치하세요:

```
your-project/
├── public/
│   ├── favicon.ico
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── apple-touch-icon.png
│   ├── icon-192x192.png
│   ├── icon-512x512.png
│   └── manifest.json
└── ...
```

---

## ✅ 체크리스트

- [ ] 모든 아이콘 파일을 `public/` 폴더에 배치
- [ ] `manifest.json` 파일 배치
- [ ] HTML `<head>`에 필수 메타 태그 추가
- [ ] 모바일에서 테스트
- [ ] PWA 설치 테스트 (iOS & Android)
- [ ] 브라우저 탭에서 파비콘 확인

---

## 🔗 관련 링크

- **프로젝트**: AdMate Vision OOH
- **운영**: KT Nasmedia (N.square)
- **웹사이트**: vision-ooh.admate.ai.kr
- **문의**: adso@nasmedia.co.kr

---

## 📝 참고사항

- 모든 아이콘은 투명 배경 PNG 포맷입니다
- 어떤 색상 배경에도 사용 가능합니다
- 원본 디자인의 비율과 선명도가 유지됩니다
- 최적화되어 파일 크기가 최소화되었습니다

---

**생성일**: 2026-02-08  
**버전**: 1.0  
**제작**: Genspark AI
