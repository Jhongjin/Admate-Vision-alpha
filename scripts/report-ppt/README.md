# Python 기반 노출량 보고서 PPT 생성

Node(pptxgenjs) 대신 **python-pptx**로 PPT를 생성할 때 사용합니다.

## 설치

```bash
pip install -r requirements.txt
```

## 사용

- **입력**: stdin에 `ReportPptParams` JSON (Node와 동일한 스키마)
- **출력**: `argv[1]` 경로에 `.pptx` 파일 저장

```bash
cat params.json | python generate_ppt.py output.pptx
```

## Node 연동

환경 변수 `USE_PYTHON_PPT=1`(또는 `true`)일 때, 보고 발송 시 Node가 이 스크립트를 호출합니다.  
Python 실행 실패 시 자동으로 기존 Node(pptxgenjs) 방식으로 생성합니다.

- **Vercel**: 기본적으로 Python 런타임이 없으므로 Node만 사용됩니다. Python 사용 시 별도 Python 서버/함수 배포가 필요합니다.
- **로컬/자체 서버**: `USE_PYTHON_PPT=1` 설정 후 `python`(또는 `python3`)이 PATH에 있으면 Python 생성이 사용됩니다.

## placeholder 치환 테스트 (report_template.pptx)

**광고주명·역명·역명 기반 공공 데이터**를 넣어서 치환이 되는지 확인하려면:

1. `public/report-ppt-templates/` 에 **report_template.pptx** 를 두고, 슬라이드/표 안에  
   `{광고주명}`, `{년.월.일}`, `{역사명}`, `{n호선}`, `{캠페인 담당자 이름}`, `{캠페인 담당자 이메일}`,  
   `{일평균 유동인구}`, `{게재 기간}`, `{예상 총 노출량}` 등을 그대로 입력해 둡니다.

2. **프로젝트 루트**에서 아래처럼 실행합니다.

```powershell
# PowerShell
Get-Content scripts/report-ppt/sample-test-placeholder.json -Raw | python scripts/report-ppt/generate_ppt.py output.pptx
```

```bash
# Bash
cat scripts/report-ppt/sample-test-placeholder.json | python scripts/report-ppt/generate_ppt.py output.pptx
```

3. 생성된 **output.pptx** 를 열어서  
   - 표지: `{광고주명}` → **테스트광고주**, `{년.월.일}` → **2026.02.06**  
   - 역/배너 슬라이드: `{역사명}` → **여의도**, `{n호선}` → **5호선**  
   - 노출량 요약: `{일평균 유동인구}` → **9.0만**, `{게재 기간}` → **7일**, `{예상 총 노출량}` → **27.0만**  
   - 문서 끝: `{캠페인 담당자 이름}` → **홍길동**, `{캠페인 담당자 이메일}` → **campaign@example.com**  
   으로 바뀌었는지 확인합니다.

**샘플 데이터** (`sample-test-placeholder.json`): 광고주=테스트광고주, 역=여의도, 5호선, 일평균 9만명, 게재 7일, 총 노출 27만명, 캠페인 담당자 홍길동 / campaign@example.com, 시간대별 노출량 6개 구간 포함.

## 템플릿 이미지

`report_template.pptx` 가 없을 때만 사용.  
`public/report-ppt-templates/` 또는 환경 변수 `REPORT_PPT_TEMPLATES_DIR`로 지정한 폴더의 이미지를 배경으로 사용합니다.
