/**
 * 촬영 이미지에서 OCR로 텍스트 추출.
 * 브라우저에서만 동작하며, Tesseract.js(kor+eng) 사용.
 */

export type OcrResult = {
  text: string;
  confidence: number;
};

/**
 * 이미지 data URL에서 텍스트를 추출한다.
 * @param imageDataUrl - 촬영된 이미지의 data URL (e.g. data:image/jpeg;base64,...)
 * @returns 추출된 전체 텍스트와 신뢰도(0~1). 실패 시 빈 문자열과 0 반환.
 */
export async function extractTextFromImage(
  imageDataUrl: string
): Promise<OcrResult> {
  if (typeof window === "undefined") {
    return { text: "", confidence: 0 };
  }

  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("kor+eng");

  try {
    const {
      data: { text, confidence },
    } = await worker.recognize(imageDataUrl);
    await worker.terminate();
    const normalizedConfidence =
      typeof confidence === "number" ? confidence / 100 : 0;
    return {
      text: text?.trim() ?? "",
      confidence: Math.min(1, Math.max(0, normalizedConfidence)),
    };
  } catch {
    await worker.terminate().catch(() => {});
    return { text: "", confidence: 0 };
  }
}
