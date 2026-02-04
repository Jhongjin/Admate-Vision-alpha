/**
 * 촬영 이미지에서 OCR로 텍스트 추출.
 * 브라우저에서만 동작하며, Tesseract.js(kor+eng) 사용.
 * 단기 기법: 전처리(2배 스케일·대비 강화) 후 OCR로 인식률 향상.
 */

export type OcrResult = {
  text: string;
  confidence: number;
};

/** 전처리: 스케일 배율 (Tesseract 300 DPI 권장, 저해상도 이미지 개선) */
const PREPROCESS_SCALE = 2;

/** 전처리: 대비 강화 계수 (1 = 유지, 1.2~1.5 = 강화) */
const PREPROCESS_CONTRAST = 1.25;

/**
 * 이미지 data URL을 2배 스케일·대비 강화하여 OCR 친화적으로 전처리한다.
 * 브라우저에서만 동작 (Canvas 2D 사용).
 */
function preprocessForOcr(imageDataUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const scale = PREPROCESS_SCALE;
        const cw = Math.min(w * scale, 4096);
        const ch = Math.min(h * scale, 4096);

        const canvas = document.createElement("canvas");
        canvas.width = cw;
        canvas.height = ch;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(imageDataUrl);
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, w, h, 0, 0, cw, ch);

        const imageData = ctx.getImageData(0, 0, cw, ch);
        const data = imageData.data;
        const contrast = PREPROCESS_CONTRAST;

        for (let i = 0; i < data.length; i += 4) {
          for (let j = 0; j < 3; j++) {
            const v = data[i + j] / 255;
            const out = ((v - 0.5) * contrast + 0.5) * 255;
            data[i + j] = Math.max(0, Math.min(255, Math.round(out)));
          }
        }

        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      } catch {
        resolve(imageDataUrl);
      }
    };

    img.onerror = () => resolve(imageDataUrl);
    img.src = imageDataUrl;
  });
}

/**
 * 이미지 data URL에서 텍스트를 추출한다.
 * 전처리(2배 스케일·대비 강화) 후 Tesseract로 인식하여 정확도를 높인다.
 *
 * @param imageDataUrl - 촬영된 이미지의 data URL (e.g. data:image/jpeg;base64,...)
 * @returns 추출된 전체 텍스트와 신뢰도(0~1). 실패 시 빈 문자열과 0 반환.
 */
export async function extractTextFromImage(
  imageDataUrl: string
): Promise<OcrResult> {
  if (typeof window === "undefined") {
    return { text: "", confidence: 0 };
  }

  const preprocessed = await preprocessForOcr(imageDataUrl);

  const { createWorker } = await import("tesseract.js");

  const worker = await createWorker("kor+eng");

  try {
    const {
      data: { text, confidence },
    } = await worker.recognize(preprocessed);
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
