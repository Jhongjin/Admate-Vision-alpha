/**
 * 서버 OCR: Google Cloud Vision API (TEXT_DETECTION).
 * GOOGLE_CLOUD_VISION_API_KEY 미설정 시 null 반환 → 클라이언트 Tesseract 폴백 유도.
 */

const VISION_API_URL =
  "https://vision.googleapis.com/v1/images:annotate";

export type ServerOcrResult = {
  text: string;
  confidence: number;
};

/**
 * data URL에서 base64 payload만 추출 (data:image/jpeg;base64, 제거).
 */
function dataUrlToBase64(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
  return match ? match[1].trim() : null;
}

/**
 * Google Cloud Vision API로 이미지에서 텍스트 추출.
 * @param imageDataUrl - data URL (e.g. data:image/jpeg;base64,...)
 * @returns 추출 텍스트와 신뢰도(0~1). API 키 없거나 실패 시 null.
 */
export async function runGoogleVisionOcr(
  imageDataUrl: string
): Promise<ServerOcrResult | null> {
  const apiKey = process.env.GOOGLE_CLOUD_VISION_API_KEY;
  if (!apiKey?.trim()) return null;

  const base64 = dataUrlToBase64(imageDataUrl);
  if (!base64) return null;

  const body = {
    requests: [
      {
        image: { content: base64 },
        features: [{ type: "TEXT_DETECTION", maxResults: 1 }],
      },
    ],
  };

  const res = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) return null;

  const data = (await res.json()) as {
    responses?: Array<{
      fullTextAnnotation?: { text?: string };
      textAnnotations?: Array<{ description?: string }>;
    }>;
  };

  const first = data.responses?.[0];
  if (!first) return null;

  const fullText = first.fullTextAnnotation?.text?.trim();
  const fallbackText =
    first.textAnnotations?.[0]?.description?.trim();

  const text = fullText ?? fallbackText ?? "";
  if (!text) return null;

  return {
    text,
    confidence: 0.95,
  };
}
