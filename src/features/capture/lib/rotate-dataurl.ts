/**
 * data URL 이미지를 90° 좌/우 회전한 새 data URL 반환.
 */

export type RotateDirection = "left" | "right";

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = dataUrl;
  });
}

/**
 * @param dataUrl - image data URL (jpeg/png)
 * @param direction - "left" = -90°, "right" = +90°
 * @returns 회전된 이미지의 data URL (jpeg)
 */
export async function rotateDataUrl(
  dataUrl: string,
  direction: RotateDirection
): Promise<string> {
  const img = await loadImage(dataUrl);
  const angle = direction === "right" ? Math.PI / 2 : -Math.PI / 2;
  const w = img.naturalWidth;
  const h = img.naturalHeight;
  const canvas = document.createElement("canvas");
  canvas.width = h;
  canvas.height = w;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2d context unavailable");
  ctx.translate(h / 2, w / 2);
  ctx.rotate(angle);
  ctx.drawImage(img, -w / 2, -h / 2, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}
