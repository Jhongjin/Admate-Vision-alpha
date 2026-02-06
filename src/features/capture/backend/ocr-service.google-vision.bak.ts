/**
 * 서버 OCR: Google Cloud Vision API (TEXT_DETECTION).
 * GOOGLE_CLOUD_VISION_API_KEY 미설정 시 null 반환 → 클라이언트 Tesseract 폴백 유도.
 */

const VISION_API_URL =
  "https://vision.googleapis.com/v1/images:annotate";

export type ServerOcrResult = {
  text: string;
  confidence: number;
  /** 역명 추출용: 바운딩 박스 면적이 큰 텍스트부터 나열(지하철 역명이 가장 크게 쓰인 경우 대비) */
  textForStation?: string;
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

  type Vertex = { x?: number; y?: number };
  const data = (await res.json()) as {
    responses?: Array<{
      fullTextAnnotation?: { text?: string };
      textAnnotations?: Array<{
        description?: string;
        boundingPoly?: { vertices?: Vertex[] };
      }>;
    }>;
  };

  const first = data.responses?.[0];
  if (!first) return null;

  const fullText = first.fullTextAnnotation?.text?.trim();
  const fallbackText =
    first.textAnnotations?.[0]?.description?.trim();

  const text = fullText ?? fallbackText ?? "";
  if (!text) return null;

  let textForStation: string | undefined;
  const annotations = first.textAnnotations;
  if (annotations && annotations.length > 1) {
    const withArea = annotations.slice(1).map((a) => {
      const desc = (a.description ?? "").trim();
      const verts = a.boundingPoly?.vertices ?? [];
      let area = 0;
      if (verts.length >= 2) {
        const xs = verts.map((v) => v.x ?? 0);
        const ys = verts.map((v) => v.y ?? 0);
        const w = Math.max(0, ...xs) - Math.min(...xs);
        const h = Math.max(0, ...ys) - Math.min(...ys);
        area = w * h;
      }
      return { desc, area };
    });
    withArea.sort((a, b) => b.area - a.area);
    const largestFirst = withArea.map((a) => a.desc).filter(Boolean).join(" ");
    if (largestFirst) textForStation = largestFirst;
  }

  return {
    text,
    confidence: 0.95,
    textForStation,
  };
}
