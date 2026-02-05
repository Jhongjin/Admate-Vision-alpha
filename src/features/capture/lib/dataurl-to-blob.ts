/**
 * data URL을 Blob으로 변환 (ZIP/업로드용).
 */
export function dataUrlToBlob(dataUrl: string, mimeType = "image/jpeg"): Blob {
  const [header, base64] = dataUrl.split(",", 2);
  const mime = header?.match(/data:([^;]+)/)?.[1] ?? mimeType;
  const binary = atob(base64 ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
}
