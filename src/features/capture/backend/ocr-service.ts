import { GoogleGenAI } from "@google/genai";

export type ServerOcrResult = {
  text: string;
  confidence: number;
  textForStation?: string; // 역명
  advertiserName?: string; // 광고주명
  line?: string; // 호선
};

// 1~4호선 (서울메트로), 5~8호선 (도시철도) 주요 역명은 모델이 학습 데이터로 알고 있음.
// 하지만 특이한 역이나 오인식을 줄이기 위해 프롬프트에 힌트 제공.

const SYSTEM_PROMPT = `당신은 서울 지하철 광고판 정보를 판독하는 AI Agents입니다.
사용자가 업로드한 광고 현장 사진을 보고 "광고주(브랜드)"와 "지하철 역명(호선)"을 추출해야 합니다.

[배경 지식]
1. 당신은 서울 지하철 1, 2, 3, 4, 5, 6, 7, 8, 9호선 및 신분당선 등 수도권 모든 지하철 역명과 호선 매핑 정보를 알고 있습니다.
2. 사진 속 텍스트, 로고, 배경 색상(호선 색상), 주변 사물(스크린도어, 역명판)을 종합적으로 분석하세요.

[수행 작업]
이미지에서 다음 정보를 찾아 JSON 형식으로 출력하세요.
- advertiser: 광고주 또는 브랜드명. (제공된 '참고 광고주 리스트'와 유사하면 해당 이름으로 매핑)
- station: 지하철 역명 (예: "강남", "홍대입구"). "역" 글자는 제외.
- line: 호선 명칭 (예: "2호선", "신분당선").
- description: 사진에 대한 1줄 요약 (광고 내용 포함).

[참고 광고주 리스트]
(여기에 DB의 광고주 목록이 들어갑니다. 이 목록에 있는 이름이면 우선적으로 선택하세요.)

[출력 형식]
오직 JSON 데이터만 출력하세요. 마크다운 코드블록(\`\`\`)을 사용하지 마세요.
{
  "advertiser": "string | null",
  "station": "string | null",
  "line": "string | null",
  "description": "string"
}
`;

function dataUrlToPart(dataUrl: string) {
  const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
  if (!match) return null;
  return {
    inlineData: {
      mimeType: match[1],
      data: match[2],
    },
  };
}

export async function runGoogleVisionOcr(
  imageDataUrl: string,
  advertiserHints: string[] = [] // DB에서 조회한 광고주 목록
): Promise<ServerOcrResult | null> {
  const apiKey = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    console.error("[GeminiOcr] missing API KEY");
    return null;
  }

  const imagePart = dataUrlToPart(imageDataUrl);
  if (!imagePart) {
    console.error("[GeminiOcr] invalid data URL");
    return null;
  }

  // 광고주 힌트 문자열 생성
  const hintsStr = advertiserHints.length > 0
    ? advertiserHints.join(", ")
    : "등록된 광고주 없음";

  const prompt = SYSTEM_PROMPT.replace(
    "[참고 광고주 리스트]\n(여기에 DB의 광고주 목록이 들어갑니다. 이 목록에 있는 이름이면 우선적으로 선택하세요.)",
    `[참고 광고주 리스트]\n${hintsStr}`
  );

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Gemini 2.0 Flash is multimodal
    // SDK usage: ai.models.generateContent({ model: "...", contents: [...] })
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }, imagePart]
        }
      ]
    });

    const jsonStr = result.text?.replace(/```json/g, "").replace(/```/g, "").trim() || "";
    const responseText = result.text || ""; // Keep original text for description fallback

    let parsed: any = {};
    try {
      if (jsonStr.startsWith("{")) {
        parsed = JSON.parse(jsonStr);
      }
    } catch (e) {
      console.warn("[GeminiOcr] JSON parse failed, raw text:", responseText);
    }

    const advertiser = parsed.advertiser || "";
    const station = parsed.station || "";
    const line = parsed.line || "";
    const description = parsed.description || responseText.slice(0, 100);

    // 기존 Vision API 호환성을 위한 text 필드 구성
    // 클라이언트는 textForStation을 우선적으로 호선/역명 매칭에 사용함.
    const combinedText = `광고주: ${advertiser}\n역명: ${station}\n호선: ${line}\n내용: ${description}`;

    return {
      text: combinedText,
      confidence: 0.99, // Gemini는 confidence를 직접 주지 않음
      textForStation: station ? `${station}역` : undefined, // 역명만 있으면 '역' 붙여서 전달
      advertiserName: advertiser || undefined,
      line: line || undefined
    };

  } catch (err) {
    console.error("[GeminiOcr] Error:", err);
    return null;
  }
}
