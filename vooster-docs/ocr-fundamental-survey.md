# OCR 근본 개선 기술 조사 (2024–2025)

**목표**: 더미 광고주 검색어 조정이 아닌, **촬영 이미지 내 모든 텍스트 추출 정확도**를 근본적으로 높이고, 추출 텍스트를 **DB에 저장된 광고주 목록**과 비교해 **유사도가 가장 높은 광고주**를 선별하는 구조로 개선.

---

## 1. 목표 정리

| 구분 | 단편적 접근 (현재 한계) | 근본적 접근 (목표) |
|------|-------------------------|---------------------|
| **텍스트 추출** | Tesseract.js만 사용, 한글 인식률 한계 | 더 정확한 OCR 모델·기법(유료/무료) 도입 |
| **매칭** | 더미 검색어만 튜닝 | 추출된 **전체 텍스트** 기반, DB 광고주 목록과 **유사도** 비교 후 최선 선별 |
| **데이터** | 더미 목록에 한정 | DB에 저장된 광고주 목록과 비교 (확장 가능 구조) |

즉, **글자 인식(OCR) 정확도**와 **추출 텍스트 ↔ 광고주 DB 유사도 매칭**이 핵심.

---

## 2. OCR 모델·서비스 조사 (유료 / 무료)

### 2.1 유료 OCR API (클라우드) — 스마트폰 옥외 광고 인식 최적화 참고

| 서비스 | 한글 지원 | 정확도·특징 | 가격 (요지) | 연동 |
|--------|-----------|-------------|-------------|------|
| **CLOVA OCR** (네이버) | ✅ **한국어 인식률 우수** | **비정형 이미지**(기울어짐, 곡면) 처리 강점, 다양한 폰트·환경 | 종량요금, 1 tps 권장 | REST API, X-OCR-SECRET 인증 |
| **Google Cloud Vision API** | ✅ (Document Text Detection) | 다국어·손글씨 50개 언어, 레이아웃 인식 우수 | 1,000건/월 무료, 이후 $1.50/1,000건 | REST API, 서버에서 이미지 전송 |
| **Upstage OCR** | ✅ | **복잡한 레이아웃** 광고 이미지에서 높은 인식률, 회전·구겨짐·복잡한 배경 처리 | 무료 크레딧·고정 요금제 | REST API |
| **Google Document AI** | ✅ | 문서 구조·폼·테이블 파싱, OCR 정확도 높음 | Enterprise OCR 약 $1.50/1,000페이지 | REST API |
| **Azure Document Intelligence** | ✅ (Read 모델) | 인쇄·손글씨, 다국어, 레이아웃 | 종량제, 지역별 상이 | REST API |
| **AWS Textract** | ✅ | 텍스트·폼·테이블 추출, AWS 연동 용이 | 페이지당 과금 | REST API |
| **ABBYY** | ✅ | 99.8% 수준 정확도, 금융·법률 등 고정밀 | 고가, 엔터프라이즈 | API·온프레미스 |

- **옥외 광고·스마트폰 촬영**: CLOVA OCR(한국어·비정형), Upstage OCR(복잡한 레이아웃), Google Vision(다국어·안정)을 우선 검토.

### 2.2 무료·오픈소스 OCR

| 엔진 | 한글 | 정확도·특징 | 배포 | 비고 |
|------|------|-------------|------|------|
| **Tesseract (현재 Tesseract.js)** | ✅ (kor) | 영문 우수, 한글 상대적으로 낮음. 스캔·이진 문서에 강함 | 브라우저(JS), 서버 | 가벼움(~10MB), 300 DPI 권장 |
| **PaddleOCR** | ✅ | 딥러닝 기반, 한글·영문 혼합에서 Tesseract 대비 우수한 사례 다수 (99.6% vs 91.1% 등) | Python 서버, PaddleX Serving, Paddle.js(브라우저) | PP-OCRv3 한글 모델, 서버 추천 |
| **EasyOCR** | ✅ | 80+ 언어, 파이썬, 사용 간편 | Python 서버 | Apache-2.0 |
| **Surya** | ✅ (90+ 언어) | 다국어 OCR·레이아웃·테이블, 라인 단위 인식 | Python (PyTorch), Replicate 등 | GPL-3.0 |

- **한글·혼합 문서**: PaddleOCR > Tesseract 인 사례가 많음. 서버 구축 가능하면 PaddleOCR(또는 PaddleX Serving) 우선 검토.
- **브라우저 전용**이면: Tesseract.js 유지 + 전처리 강화, 또는 Paddle.js + PP-OCRv3 한글(모델 용량·로딩 비용 고려).
- **고려 대상 정리**: **PaddleOCR**, **EasyOCR**(2.2) — 무료·자체 호스팅 시 후보. **Upstage OCR**(2.1) — 복잡한 레이아웃·광고 이미지에서 강점, 유료 API. 위 모델들은 서버 OCR 도입·교체 시 Google/CLOVA와 함께 평가 대상.

### 2.3 정확도 향상 기법 (엔진 무관) — 옥외 광고 촬영 참고

| 기법 | 설명 | 효과 |
|------|------|------|
| **TPS(Thin Plate Spline)** | 촬영 각도에 따른 비스듬한 텍스트를 정면에서 보는 것처럼 보정 | 기울어진 광고판 인식 향상 |
| **노이즈 제거·이진화** | 야간·조명 반사 노이즈 제거, 배경/글자 명확 분리(Otsu 등) | 노이즈·그림자 완화 |
| **초해상도 복원** | AI로 저해상도 텍스트 이미지를 고화질로 복원 | 저해상도 촬영 인식 향상 |
| **CLAHE** | 지역별 밝기 대비 향상 | 조명 불균형(옥외·실내) 완화 |
| **해상도·스케일** | 300 DPI 권장(Tesseract). 저해상도 이미지는 2배 업스케일 등 | 문자 인식률 향상 |
| **이진화(Binarization)** | Otsu 등으로 흑백 변환, 배경/문자 대비 강화 | 노이즈·그림자 완화 |
| **대비(Contrast)** | 명암 대비 증가 | 흐린·저대비 텍스트 개선 |
| **기울기 보정(Deskew)** | 기울어진 이미지 보정 | 라인 단위 인식 개선 |
| **선택적 적용** | “덜 수정” 원칙. 과도한 전처리는 글자 손상 유발 | 안정성 |

- **구현**: 브라우저에서는 Canvas 2D로 리사이즈·대비 조정 가능. TPS·CLAHE·초해상도는 서버(OpenCV 등) 또는 전용 라이브러리 검토.

### 2.4 Google Cloud Vision API 예상 비용 (Text Detection)

- **과금 단위**: 이미지 1장 = 1 유닛. Text Detection / Document Text Detection 동일 요금.
- **요금 (2024–2025 기준, USD)**  
  - 매월 **1~1,000장**: 무료  
  - **1,001~5,000,000장**: 1,000장당 **$1.50**  
  - **5,000,001장 이상**: 1,000장당 **$0.60**

| 월 촬영 건수 (이미지) | 유료 구간 (장) | 예상 비용 (USD) |
|------------------------|----------------|------------------|
| 100 | 0 | $0 |
| 500 | 0 | $0 |
| 1,000 | 0 | $0 |
| 1,500 | 500 | 약 $0.75 |
| 5,000 | 4,000 | $6.00 |
| 10,000 | 9,000 | $13.50 |
| 50,000 | 49,000 | $73.50 |
| 100,000 | 99,000 | $148.50 |

- **계산식**: `비용 = max(0, (건수 - 1000)) × 1.50 / 1000` (월 500만 장 이하 구간).
- **참고**: [Cloud Vision pricing](https://cloud.google.com/vision/pricing). 실제 청구는 1,000 유닛 단위로 블록 과금되며, 마지막 블록은 비례 계산됩니다.

---

## 3. 아키텍처 옵션

### 3.1 옵션 A: 클라이언트 전용 (현재 + 전처리) — **적용됨**

- **구성**: 브라우저에서 **전처리(2배 스케일·대비 1.25배)** 후 Tesseract.js로 OCR. (`src/features/capture/lib/ocr.ts`)
- **장점**: 서버 비용 없음, 배포 단순.
- **단점**: 한글 인식 한계는 근본 해결 어려움. 개선되지 않으면 서버 OCR로 전환.

### 3.2 옵션 B: 서버 OCR API (근본 개선)

- **구성**: 클라이언트 → 이미지 업로드 → 서버에서 OCR(유료 API 또는 PaddleOCR/EasyOCR 등) → 텍스트 반환 → 클라이언트/서버에서 DB 광고주와 유사도 매칭.
- **장점**: Google Vision / Azure / PaddleOCR 등으로 **추출 정확도** 크게 향상, DB 연동 자연스러움.
- **단점**: 서버·API 비용, 네트워크 지연.

### 3.3 옵션 C: 하이브리드

- **구성**: 먼저 클라이언트 Tesseract.js로 추출 → 추출 결과가 비어 있거나 신뢰도 낮으면 서버 OCR(또는 유료 API) 호출.
- **장점**: 일반 케이스는 비용·지연 절감, 어려운 이미지는 고품질 OCR로 보완.

---

## 4. 추천 방향 (근본 해결)

1. **OCR 단계**
   - **단기(1단계)**: Tesseract.js + 전처리(2배 스케일, 대비, rotateAuto) — 적용 완료. 상용화 수준 미달 시 2단계로.
   - **2단계(서버 OCR)**: **서버 OCR API** 도입.  
     - **한국어·옥외 광고 우선**: **CLOVA OCR**(네이버 클라우드), **Upstage OCR**(복잡 레이아웃).  
     - **범용·다국어**: **Google Cloud Vision API**(Document Text Detection), Azure Document Intelligence.  
     - **무료·자체 호스팅**: PaddleOCR(EasyOCR) 서버 API.
2. **매칭 단계**
   - **유지·강화**: 추출된 **전체 텍스트**와 **DB 광고주 목록** 간 exact + fuzzy 유사도 매칭 → **가장 유사한 광고주** 선별.
   - **향후**: OCR 결과 + **NLP**로 문맥적 의미 파악 후 광고주 매칭, **이미지 객체 인식**(YOLO 등) 병행·카테고리 분류, **GPS/위치 기반** 데이터와 대조.
3. **데이터**
   - 더미가 아닌 **DB에 저장된 광고주 목록**을 단일 소스로 사용하도록 구조 변경.

---

## 5. 2단계 실행 계획 (서버 OCR)

1. **API**: `POST /api/capture/ocr` — body `{ imageDataUrl: string }`, 응답 `{ text: string, confidence: number }`. 서버에서 Google Vision API(또는 CLOVA/Upstage) 호출.
2. **환경 변수**: `GOOGLE_CLOUD_VISION_API_KEY`(선택). 미설정 시 503 반환 → 클라이언트는 기존 Tesseract.js로 폴백.
3. **클라이언트**: 촬영 확인 페이지에서 **서버 OCR 우선 호출** → 실패 시 클라이언트 OCR(Tesseract.js) 사용.
4. **향후 교체**: 동일 API 스펙 유지하고 백엔드만 CLOVA OCR / Upstage OCR로 교체 가능.

## 6. 참고 링크

- **CLOVA OCR** (네이버): https://www.ncloud.com/product/aiService/ocr , https://api-fin.ncloud-docs.com/docs/ai-application-service-ocr  
- **Upstage Document AI / OCR**: https://upstage.ai/news/upstage-ocr-api  
- Google Cloud Vision: https://cloud.google.com/vision/docs  
- Google Vision pricing: https://cloud.google.com/vision/pricing  
- Document AI pricing: https://cloud.google.com/document-ai/pricing  
- Azure Document Intelligence: https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/  
- PaddleOCR: https://github.com/PaddlePaddle/PaddleOCR  
- PaddleOCR Serving (PaddleX): https://paddlepaddle.github.io/PaddleOCR/main/en/version3.x/deployment/serving.html  
- Paddle.js (browser): https://www.paddleocr.ai/ (infer_deploy / paddle_js)  
- EasyOCR: https://github.com/JaidedAI/EasyOCR  
- Surya OCR: https://github.com/VikParuchuri/surya  
- Tesseract Improving Quality: https://tesseract-ocr.github.io/tessdoc/ImproveQuality  
- OCR 전처리: Scaling, Otsu binarization, contrast, TPS, CLAHE (Medium, IRI, EasyRPA 등)

---

## 7. 관련 문서

- `vooster-docs/capture-recognition-spec.md` — 촬영·인식 명세  
- `vooster-docs/recognition-rate-analysis.md` — 인식률 원인 분석  
- `vooster-docs/ocr-advertiser-matching-tech-review.md` — OCR·매칭 요약  
- `src/features/capture/lib/ocr.ts` — 현재 OCR  
- `src/features/capture/lib/match-advertiser.ts` — 광고주 유사도 매칭  
