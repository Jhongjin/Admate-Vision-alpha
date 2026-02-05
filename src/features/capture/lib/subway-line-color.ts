/**
 * 지하철 역명판 이미지에서 역명판 원형 배경 색상을 샘플링해 호선 추정.
 * 서울 지하철 노선 색상 기준 (역명판 원형/띠 색상).
 */

/** 호선별 대표 RGB (역명판 원형 색상) */
const SUBWAY_LINE_RGB: { line: string; r: number; g: number; b: number }[] = [
  { line: "1호선", r: 0, g: 82, b: 164 },
  { line: "2호선", r: 0, g: 168, b: 77 },
  { line: "3호선", r: 239, g: 124, b: 28 },
  { line: "4호선", r: 0, g: 164, b: 227 },
  { line: "5호선", r: 153, g: 108, b: 172 },
  { line: "6호선", r: 205, g: 124, b: 47 },
  { line: "7호선", r: 116, g: 127, b: 0 },
  { line: "8호선", r: 230, g: 24, b: 108 },
  { line: "9호선", r: 173, g: 173, b: 161 },
];

function rgbDistance(
  r1: number,
  g1: number,
  b1: number,
  r2: number,
  g2: number,
  b2: number
): number {
  return Math.sqrt(
    (r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2
  );
}

/**
 * RGB와 가장 가까운 호선 반환.
 */
export function matchRgbToSubwayLine(
  r: number,
  g: number,
  b: number
): string | null {
  let best: { line: string; dist: number } | null = null;
  for (const { line, r: lr, g: lg, b: lb } of SUBWAY_LINE_RGB) {
    const dist = rgbDistance(r, g, b, lr, lg, lb);
    if (best == null || dist < best.dist) {
      best = { line, dist };
    }
  }
  return best ? best.line : null;
}

/**
 * 이미지 data URL에서 역명판 영역(상단 일부)의 주조색을 샘플링해 호선 추정.
 * 역명판 원형이 보통 상단·좌측에 있으므로 상단 30% 영역에서 샘플.
 */
export function getSubwayLineFromImage(imageDataUrl: string): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0);
        const sampleHeight = Math.max(1, Math.floor(h * 0.35));
        const imageData = ctx.getImageData(0, 0, w, sampleHeight);
        const data = imageData.data;
        let rSum = 0;
        let gSum = 0;
        let bSum = 0;
        let count = 0;
        const step = 4 * 10;
        for (let i = 0; i < data.length; i += step) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];
          if (a < 128) continue;
          const gray = (r + g + b) / 3;
          if (gray < 20 || gray > 250) continue;
          rSum += r;
          gSum += g;
          bSum += b;
          count++;
        }
        if (count === 0) {
          resolve(null);
          return;
        }
        const r = Math.round(rSum / count);
        const g = Math.round(gSum / count);
        const b = Math.round(bSum / count);
        resolve(matchRgbToSubwayLine(r, g, b));
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = imageDataUrl;
  });
}
