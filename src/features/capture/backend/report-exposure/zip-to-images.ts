/**
 * ZIP 첨부에서 이미지 파일만 추출해 base64 배열로 반환 (PPT 촬영 이미지 슬라이드용).
 */

import JSZip from "jszip";

const IMAGE_EXT = /\.(jpg|jpeg|png|gif|webp)$/i;

function mimeFromFilename(name: string): string {
  const lower = name.toLowerCase();
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".gif")) return "image/gif";
  if (lower.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

/**
 * ZIP base64 문자열에서 이미지 파일들의 base64 목록을 추출.
 * 파일명 순 정렬하여 슬라이드 순서를 일정하게 유지.
 * 반환값은 PPT addImage용: "image/jpeg;base64,xxx" 또는 "image/png;base64,xxx" 형태.
 */
export async function extractImageBase64sFromZip(zipBase64: string): Promise<string[]> {
  if (!zipBase64 || typeof zipBase64 !== "string") return [];
  const buf = Buffer.from(zipBase64, "base64");
  const zip = await JSZip.loadAsync(buf);
  const names = Object.keys(zip.files).filter((name) => {
    const entry = zip.files[name];
    return entry && !entry.dir && IMAGE_EXT.test(name);
  });
  names.sort();
  const out: string[] = [];
  for (const name of names) {
    const file = zip.files[name];
    if (!file?.dir) {
      const base64 = await file.async("base64");
      const mime = mimeFromFilename(name);
      out.push(`data:${mime};base64,${base64}`);
    }
  }
  return out;
}
