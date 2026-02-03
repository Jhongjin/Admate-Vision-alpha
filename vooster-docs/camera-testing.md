# 카메라 기능 테스트 방법

광고 촬영 화면(`/capture`)의 카메라( getUserMedia ) 테스트 방법 정리.

---

## 1. PC(로컬 dev)에서 테스트

- **브라우저**에서 `getUserMedia`는 **PC 웹캠**을 사용합니다.
- **Chrome, Edge, Firefox** 등 데스크톱 브라우저는 `http://localhost:3000` 에서도 카메라 접근을 허용합니다.
- **방법**
  1. `npm run dev` 실행 후 브라우저에서 `http://localhost:3000` 접속
  2. 이메일 등록 후 `/capture` 이동
  3. 카메라 권한 허용 시 웹캠 영상이 미리보기에 표시됨
- **주의**: localhost가 아닌 `http://127.0.0.1:3000` 도 대부분 동일하게 동작합니다.

---

## 2. 스마트폰에서 테스트 (실제 서비스에 가까운 환경)

- **같은 Wi‑Fi**에서 PC의 IP로 접속합니다.
- dev 서버 실행 시 터미널에 예시처럼 표시됩니다:  
  `Network: http://10.0.0.155:3000`
- **Android (Chrome)**  
  - 같은 네트워크에서 `http://10.0.0.155:3000` (본인 PC IP로 변경) 접속  
  - HTTP만으로도 카메라 권한 허용 후 테스트 가능한 경우가 많습니다.
- **iOS (Safari)**  
  - 보안 정책상 **HTTPS** 또는 **localhost**를 요구하는 경우가 많습니다.  
  - HTTP IP 접속 시 카메라가 안 뜨면:
    - PC에서 **ngrok** 등으로 HTTPS 터널 열기:  
      `ngrok http 3000` → 나온 `https://...` 주소를 폰에서 접속  
    - 또는 Mac에서 Safari로 `http://localhost:3000` (Simulator가 아닌 **실기기**는 같은 망이어도 localhost 불가하므로, 실기기는 ngrok 등 HTTPS 권장)

---

## 3. 요약

| 환경              | 접속 주소                    | 카메라 |
|-------------------|-----------------------------|--------|
| PC (로컬 dev)     | `http://localhost:3000`     | ✅ 웹캠 |
| 스마트폰 (같은 Wi‑Fi) | `http://<PC_IP>:3000`       | ✅ Android는 HTTP 가능, iOS는 HTTPS 권장 |
| 스마트폰 (HTTPS)   | ngrok 등 `https://...`      | ✅ iOS 포함 안정적 |

실제 배포와 비슷하게 보려면 스마트폰 + (가능하면 HTTPS) 로 한 번씩 테스트하는 것이 좋습니다.
