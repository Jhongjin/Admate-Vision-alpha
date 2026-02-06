/**
 * AI 성과 분석(Gemini) 로컬 테스트 스크립트
 *
 * 형태·내용 확인용. .env.local 의 GEMINI_API_KEY 로 Gemini 호출 후 결과를 콘솔에 출력합니다.
 *
 * 실행 (프로젝트 루트에서):
 *   npm run test:ai-analysis
 * 또는:
 *   npx dotenv -e .env.local -- tsx scripts/test-ai-analysis.ts
 */

import { generateAiAnalysis } from "../src/features/capture/backend/ai-analysis-service";

const SAMPLE = {
  station: "강남",
  line: "2호선",
  advertiserName: "테스트 광고주",
  dateStr: "20260206",
};

async function main() {
  console.log("--- AI 성과 분석 테스트 (로컬) ---\n");
  console.log("입력:", SAMPLE);
  console.log("");

  const hasKey = !!(
    process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY
  );
  console.log(
    hasKey ? "✓ GEMINI_API_KEY 사용 (Gemini API 호출)" : "✗ API 키 없음 → Mock 결과"
  );
  console.log("");

  const result = await generateAiAnalysis(SAMPLE);

  console.log("--- 결과 (형태·내용 확인) ---\n");
  console.log("analysisText:");
  console.log(result.analysisText);
  console.log("");
  console.log("metrics:", JSON.stringify(result.metrics, null, 2));
  console.log("");
  console.log("chartData:", JSON.stringify(result.chartData, null, 2));
  console.log("");
  console.log("--- 전체 JSON ---");
  console.log(JSON.stringify(result, null, 2));
}

main().catch((e) => {
  console.error("실행 오류:", e);
  process.exit(1);
});
