# OCR 및 광고주 매칭 기술 검토 (2024–2025)

광고 이미지 텍스트 전수 조사 후, 기 등록 광고주 정보와 **가장 유사한** 광고주를 선별하는 로직 구체화 및 최신 기술 검토.

> **근본 개선**: 더미 검색어 조정이 아닌 **OCR 추출 정확도**와 **DB 광고주 목록과의 유사도 매칭** 중심의 조사·권장은 **`ocr-fundamental-survey.md`** 참고.

---

## 1. 요구 흐름 정리

1. **이미지 텍스트 전수 조사**: OCR로 광고 이미지에서 추출 가능한 텍스트 전부 수집.
2. **기 등록 광고주 정보와 매칭**: 등록된 광고주별 대표 텍스트(검색어/키워드)와 비교.
3. **가장 유사한 광고주 선별**: 이미지에 포함된 텍스트와 등록 텍스트가 **가장 유사한** 광고주를 인식 결과로 선택.

광고 이미지에는 광고주명만 있는 것이 아니라 문구·이벤트 등 다양한 텍스트가 섞여 있으므로, **완전 일치가 아닌 유사도 기반 선별**이 필요함.

---

## 2. OCR 기술 검토

### 2.1 현재 (Tesseract.js)

- **특징**: 브라우저에서 동작, kor+eng 지원, 별도 서버 불필요.
- **한계**: 한글 인식률이 영문보다 낮고, 해상도·기울기·폰트에 민감.

### 2.2 최신/대안 OCR (웹 검색 기준)

| 기술 | 설명 | 브라우저 | 한글 |
|------|------|----------|------|
| **Tesseract.js** | Pure JS OCR, 100+ 언어 | ✅ | ✅ (kor) |
| **PaddleOCR-VL** | 문서 파싱 SOTA, 109개 언어 | Paddle.js로 가능 | ✅ |
| **Paddle.js + PP-OCRv3** | @paddle-js-models/ocr, PP-OCRv3 경량화 | ✅ | ✅ (dict_korean, rec_korean) |
| **Scribe.js** | 이미지/PDF 텍스트 추출 | ✅ | 문서 확인 필요 |

- **PaddleOCR / Paddle.js**: 한글 인식 품질이 Tesseract보다 우수하다는 평가 많음. 브라우저에서는 Paddle.js + PP-OCRv3 한글 모델 사용 가능. 모델 용량·초기 로딩 비용 고려 필요.
- **Tesseract 품질 향상**: 해상도 업스케일(예: 2배), 대비 강화, 이진화(오츠 등) 등 **이미지 전처리** 후 인식 시 정확도 향상 가능. (참고: Tesseract 공식 Improving Quality, Stack Overflow 등)

### 2.3 적용 방향

- **단기**: Tesseract.js 유지 + (선택) 경량 전처리(리사이즈·대비).
- **중기**: 한글 인식률이 핵심 이슈일 경우 Paddle.js + PP-OCRv3 한글 모델 검토.

---

## 3. 텍스트 유사도·매칭 기술 검토

### 3.1 요구사항

- 이미지에서 나온 **전체 텍스트**와 각 광고주의 **등록 텍스트(검색어)** 를 비교.
- **가장 유사한** 광고주를 고르려면: 문자열 유사도(퍼지 매칭) 필요.

### 3.2 오픈소스·라이브러리 (웹 검토)

| 구분 | 도구 | 설명 | 환경 |
|------|------|------|------|
| **문자열 유사도** | RapidFuzz, FuzzyWuzzy | Levenshtein, Jaro-Winkler, partial ratio 등 | Python |
| **문자열 유사도** | fastest-levenshtein | Levenshtein 거리/가장 가까운 문자열, 고성능 | Node·브라우저 |
| **문자열 유사도** | Talisman, Wuzzy, string-comparisons | Levenshtein, Jaro-Winkler 등 다수 메트릭 | JS/브라우저 |
| **브랜드 인식** | ADVISE, BrandDetector, Open Brands Dataset | 광고/브랜드 시각 인식 연구·데이터 | 서버/학습 |

- **브라우저에서 곧바로 사용**: JS 라이브러리 필요. **fastest-levenshtein** (거리 → 유사도 변환) 또는 **string-similarity** 등으로 “등록 텍스트와 가장 유사한 후보” 선별 가능.
- **광고/브랜드 전용 모델**: ADVISE, BrandDetector, Open Brands 등은 주로 **이미지 → 브랜드** 예측용. “OCR 텍스트 ↔ 등록 텍스트 유사도”와는 별개이나, 추후 “이미지에서 직접 광고주 추론” 확장 시 참고 가능.

### 3.3 적용 방향

- **이미지 텍스트 전수 조사** → OCR 결과 1개 문자열(또는 문장/단어 단위로 분리).
- **등록 광고주별** 대표 텍스트(검색어 목록)와 비교:
  - **완전 포함(exact substring)**: 기존처럼 가중치 높게 점수 부여.
  - **유사도(fuzzy)**: Levenshtein 기반 유사도(예: 1 - distance/maxLen)로 “이미지 텍스트 중 일부 vs 등록 텍스트” 점수 부여.
- **광고주별 점수 집계** (예: exact 점수 + fuzzy 점수) 후 **가장 높은 점수의 광고주**를 “인식된 광고주”로 선별, 임계값 미만이면 “미인식”.

---

## 4. 로직 구체화 (구현 가이드)

1. **OCR**: 기존과 동일하게 이미지 → 텍스트 전수 추출 (Tesseract.js). (선택) 전처리 적용.
2. **정규화**: OCR 텍스트·등록 검색어 모두 공백 정규화, 소문자(영문) 등으로 통일.
3. **광고주별 점수**:
   - **Exact**: 등록 검색어가 OCR 텍스트에 **포함**되면 가중치 반영 (길이·개수 등).
   - **Fuzzy**: 등록 검색어와 OCR 텍스트(또는 OCR를 단어/구 단위로 나눈 것) 간 **유사도** 계산 → 최대 유사도 또는 가중 합으로 점수화.
4. **선별**: 점수가 가장 높은 광고주를 선택하고, 해당 점수가 **임계값 이상**이면 해당 광고주를 인식 결과로 반환, 아니면 “미인식”.

이렇게 하면 “이미지에 포함된 텍스트와 등록된 광고주 정보(텍스트)가 **가장 유사한** 것”을 선별하는 방식으로 구체화됨.

---

## 5. 참고 링크 (요약)

- Tesseract.js: https://tesseract.projectnaptha.com/
- Tesseract Improving Quality: https://tesseract-ocr.github.io/tessdoc/ImproveQuality
- PaddleOCR / Paddle.js: https://www.paddleocr.ai/ , Paddle.js 브라우저 배포 문서
- fastest-levenshtein: https://www.npmjs.com/package/fastest-levenshtein
- ADVISE (광고 이해): https://github.com/yekeren/ADVISE-Image_ads_understanding
- Open Brands Dataset / Brand Net: 논문·데이터셋 검색

---

## 6. 관련 문서

- **`vooster-docs/ocr-fundamental-survey.md`** — OCR 근본 개선 기술 조사 (유료/무료 모델·기법·아키텍처)
- `vooster-docs/capture-recognition-spec.md` — 촬영·인식 명세
- `vooster-docs/recognition-rate-analysis.md` — 인식률 원인 분석
- `src/features/capture/lib/ocr.ts` — OCR
- `src/features/capture/lib/match-advertiser.ts` — 광고주 매칭
