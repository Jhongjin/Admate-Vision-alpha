/**
 * sessionStorage 용량 절감을 위해 data URL 이미지를 리사이즈·압축.
 * 최대 너비 및 JPEG 품질로 용량을 줄인 data URL 반환.
 */

const DEFAULT_MAX_WIDTH = 1200;
const DEFAULT_QUALITY = 0.75;

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

export type CompressDataUrlOptions = {
  /** 최대 너비 (초과 시 비율 유지하여 축소). 기본 1200 */
  maxWidth?: number;
  /** JPEG 품질 0~1. 기본 0.75 */
  quality?: number;
};

/**
 * data URL 이미지를 압축하여 sessionStorage 저장용으로 적합한 크기로 반환.
 * @param dataUrl - image/jpeg 또는 image/png data URL
 * @returns 압축된 image/jpeg data URL
 */
export async function compressDataUrl(
  dataUrl: string,
  options: CompressDataUrlOptions = {}
): Promise<string> {
  const { maxWidth = DEFAULT_MAX_WIDTH, quality = DEFAULT_QUALITY } = options;
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  if (w <= maxWidth && h <= maxWidth) {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return dataUrl;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/jpeg", quality);
  }
  const scale = maxWidth / Math.max(w, h);
  const cw = Math.round(w * scale);
  const ch = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext("2d");
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, cw, ch);
  return canvas.toDataURL("image/jpeg", quality);
}
