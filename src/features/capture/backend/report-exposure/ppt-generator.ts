/**
 * Phase 4: 노출량 보고서 PPT 생성.
 * USE_PYTHON_PPT=1 이면 Python(scripts/report-ppt/generate_ppt.py) 사용, 실패 시 pptxgenjs 사용.
 * 템플릿 이미지(public/report-ppt-templates) 배경 + 내용 오버레이.
 */

import { spawnSync } from "node:child_process";
import fs from "fs/promises";
import os from "node:os";
import path from "node:path";
import PptxGenJS from "pptxgenjs";
import type { ReportPptParams } from "./types";

const FONT_FACE = "NanoSans KR";
const SLIDE_W = 10;
const SLIDE_H = 5.625; // 16:9

/** public/report-ppt-templates 폴더 내 실제 파일명(.png 또는 .png.jpg) */
const TEMPLATE_NAMES = {
  cover: "slide-01-cover.png.jpg",
  summary: "slide-02-summary.png.jpg",
  banner: "slide-03-banner.png.jpg",
  end: "slide-04-End.png.jpg",
} as const;

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}백만`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString();
}

/** 만 단위 (예: 6.8만) */
function formatMan(n: number): string {
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString();
}

/** public/report-ppt-templates에서 템플릿 이미지 로드. 없으면 null (.png.jpg → .png 순으로 시도) */
async function loadTemplateBase64(
  filename: string
): Promise<{ data: string; mime: string } | null> {
  const base = path.join(process.cwd(), "public", "report-ppt-templates");
  const toTry = [filename];
  if (filename.endsWith(".png.jpg")) toTry.push(filename.replace(/\.png\.jpg$/i, ".png"));
  for (const name of toTry) {
    try {
      const p = path.join(base, name);
      const buf = await fs.readFile(p);
      const base64 = buf.toString("base64");
      const ext = path.extname(name).toLowerCase();
      const mime = ext === ".png" ? "image/png" : "image/jpeg";
      return { data: `${mime};base64,${base64}`, mime };
    } catch {
      continue;
    }
  }
  return null;
}

/** Python 스크립트로 PPT 생성. 실패 시 null (Node fallback 사용). */
async function generateReportPptPython(params: ReportPptParams): Promise<Buffer | null> {
  const scriptPath = path.join(process.cwd(), "scripts", "report-ppt", "generate_ppt.py");
  try {
    await fs.access(scriptPath);
  } catch {
    return null;
  }
  const outPath = path.join(os.tmpdir(), `report-ppt-${Date.now()}-${Math.random().toString(36).slice(2)}.pptx`);
  const input = JSON.stringify(params);
  const result = spawnSync("python", [scriptPath, outPath], {
    input,
    encoding: "utf8",
    maxBuffer: 50 * 1024 * 1024,
    timeout: 60_000,
  });
  if (result.status !== 0) {
    console.warn("[report-ppt] Python script failed:", result.stderr?.slice(0, 500));
    return null;
  }
  try {
    const buf = await fs.readFile(outPath);
    return buf;
  } finally {
    await fs.unlink(outPath).catch(() => {});
  }
}

/**
 * 노출량 보고서 PPT 생성. Buffer 반환 (메일 첨부용).
 * USE_PYTHON_PPT=1 이면 Python 시도 후 실패 시 Node(pptxgenjs) 사용.
 */
export async function generateReportPpt(params: ReportPptParams): Promise<Buffer> {
  const usePython = process.env.USE_PYTHON_PPT === "1" || process.env.USE_PYTHON_PPT === "true";
  if (usePython) {
    const buf = await generateReportPptPython(params);
    if (buf != null) return buf;
  }
  return generateReportPptNode(params);
}

/** Node(pptxgenjs)로 PPT 생성. */
async function generateReportPptNode(params: ReportPptParams): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = `게재 현황 보고서 - ${params.advertiserName}`;
  pptx.author = "AdMate Vision";

  const {
    advertiserName,
    station,
    line,
    displayDays,
    exposure,
    imageBase64s,
    subtitle,
    dateStr,
    campaignManagerName,
    campaignManagerEmail,
  } = params;

  const fontOpt = { fontFace: FONT_FACE };

  const tCover = await loadTemplateBase64(TEMPLATE_NAMES.cover);
  const tSummary = await loadTemplateBase64(TEMPLATE_NAMES.summary);
  const tBanner = await loadTemplateBase64(TEMPLATE_NAMES.banner);
  const tEnd = await loadTemplateBase64(TEMPLATE_NAMES.end);

  // ——— 슬라이드 1: 표지 ———
  const slide1 = pptx.addSlide();
  if (tCover) {
    slide1.background = { data: tCover.data };
    const year = dateStr ? dateStr.slice(0, 4) : "";
    const month = dateStr ? dateStr.slice(4, 6) : "";
    const day = dateStr ? dateStr.slice(6, 8) : "";
    const dateFormatted = year && month && day ? `${year}.${month}.${day}` : "";
    slide1.addText(`${advertiserName} N.square 광고배너 게재보고서`, {
      x: 0.8,
      y: 2.0,
      w: 8,
      h: 0.7,
      fontSize: 24,
      bold: true,
      color: "FFFFFF",
      ...fontOpt,
    });
    if (dateFormatted) {
      slide1.addText(dateFormatted, {
        x: 4,
        y: 5.0,
        w: 2,
        h: 0.35,
        fontSize: 14,
        align: "center",
        color: "FFFFFF",
        ...fontOpt,
      });
    }
  } else {
    slide1.addText(`${advertiserName} 게재 현황 보고서`, {
      x: 0.5,
      y: 1.2,
      w: 9,
      h: 0.8,
      fontSize: 28,
      bold: true,
      align: "center",
      ...fontOpt,
    });
    slide1.addText(`${line} ${station}${subtitle ? ` · ${subtitle}` : ""}`, {
      x: 0.5,
      y: 2.0,
      w: 9,
      h: 0.4,
      fontSize: 18,
      align: "center",
      ...fontOpt,
    });
    if (dateStr) {
      slide1.addText(
        `보고 일자: ${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
        {
          x: 0.5,
          y: 2.6,
          w: 9,
          h: 0.35,
          fontSize: 14,
          align: "center",
          ...fontOpt,
        }
      );
    }
  }

  // ——— 슬라이드 2: 노출량 요약 (공공기관 데이터 기반 수치 전부 반영) ———
  const slide2 = pptx.addSlide();
  if (tSummary) {
    slide2.background = { data: tSummary.data };
    const byTimeBandRaw = exposure.byTimeBand ?? [];
    // 시안 참고: 노출량 기준 내림차순 정렬 → 1순위=피크, 2순위=2번째
    const byTimeBand = [...byTimeBandRaw].sort((a, b) => b.exposure - a.exposure);
    const peak = byTimeBand[0];
    const second = byTimeBand[1];
    slide2.addText(`${advertiserName} 예상 노출량 리포트`, {
      x: 0.5,
      y: 0.25,
      w: 6,
      h: 0.45,
      fontSize: 20,
      bold: true,
      color: "FFFFFF",
      ...fontOpt,
    });
    slide2.addText(
      `피크 시간대: ${peak?.band ?? "-"} (${peak ? formatMan(peak.exposure) : "0"}명)`,
      { x: 7, y: 0.3, w: 2.2, h: 0.3, fontSize: 11, color: "FFFFFF", ...fontOpt }
    );
    if (second) {
      slide2.addText(
        `2순위: ${second.band} (${formatMan(second.exposure)}명)`,
        { x: 7, y: 0.55, w: 2.2, h: 0.3, fontSize: 11, color: "FFFFFF", ...fontOpt }
      );
    }
    slide2.addText(`${line} ${station}`, {
      x: 0.5,
      y: 0.95,
      w: 2,
      h: 0.35,
      fontSize: 12,
      color: "FFFFFF",
      ...fontOpt,
    });
    slide2.addText(`${formatMan(exposure.dailyFlow)}명`, {
      x: 2.6,
      y: 0.95,
      w: 2,
      h: 0.35,
      fontSize: 12,
      color: "FFFFFF",
      ...fontOpt,
    });
    slide2.addText(`${exposure.displayDays}일`, {
      x: 4.7,
      y: 0.95,
      w: 1.2,
      h: 0.35,
      fontSize: 12,
      color: "FFFFFF",
      ...fontOpt,
    });
    slide2.addText(`${formatMan(exposure.totalExposure)}명`, {
      x: 6,
      y: 0.95,
      w: 2,
      h: 0.35,
      fontSize: 12,
      color: "FFFFFF",
      ...fontOpt,
    });
    const totalMan = exposure.totalExposure / 10_000;
    const timeRows: { text: string }[][] = [
      [{ text: "시간대" }, { text: "예상 노출량(만명)" }, { text: "비중" }, { text: "순위" }],
      ...byTimeBand.map((b, i) => [
        { text: i === 0 ? `${b.band} 피크` : b.band },
        { text: (b.exposure / 10_000).toFixed(1) },
        {
          text: totalMan > 0 ? `${((b.exposure / exposure.totalExposure) * 100).toFixed(0)}%` : "0%",
        },
        { text: `${i + 1}` },
      ]),
    ];
    slide2.addTable(timeRows, {
      x: 0.5,
      y: 1.5,
      w: 4.2,
      colW: [1, 1.5, 0.8, 0.5],
      fontSize: 10,
      border: { pt: 0.25, type: "solid", color: "333333" },
      color: "FFFFFF",
      fill: { color: "1a1a1a" },
      ...fontOpt,
    });
    if (byTimeBand.length > 0) {
      // 시안: 막대그래프는 만 단위(0~8 스케일), 파이는 원본 값으로 비중 자동 계산
      const barData = [
        {
          name: "예상 노출량(만명)",
          labels: byTimeBand.map((b) => b.band),
          values: byTimeBand.map((b) => b.exposure / 10_000),
        },
      ];
      slide2.addChart(pptx.ChartType.bar, barData, {
        x: 5,
        y: 1.4,
        w: 4.5,
        h: 2.2,
        barDir: "col",
        chartColors: ["4472C4", "ED7D31", "A5A5A5", "FFC000", "5B9BD5", "70AD47"],
        showLegend: false,
        fontSize: 9,
        ...fontOpt,
      });
      const pieData = [
        {
          name: "시간대 비중",
          labels: byTimeBand.map((b) => b.band),
          values: byTimeBand.map((b) => b.exposure),
        },
      ];
      slide2.addChart(pptx.ChartType.pie, pieData, {
        x: 5,
        y: 3.7,
        w: 4.5,
        h: 1.6,
        showLegend: true,
        legendPos: "b",
        fontSize: 9,
        ...fontOpt,
      });
    }
    slide2.addText(
      "※ 본 수치는 공공데이터(역사별 승·하차/유동인구) 기반 추정치이며, 실제 광고 노출 수는 편차가 있을 수 있습니다.",
      {
        x: 0.5,
        y: 5.15,
        w: 9,
        h: 0.4,
        fontSize: 8,
        color: "AAAAAA",
        ...fontOpt,
      }
    );
  } else {
    slide2.addText("예상 노출량 요약", {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 22,
      bold: true,
      ...fontOpt,
    });
    const summaryRows: { text: string }[][] = [
      [{ text: "항목" }, { text: "내용" }],
      [{ text: "역/호선" }, { text: `${line} ${station}` }],
      [{ text: "일평균 유동인구" }, { text: `${formatNumber(exposure.dailyFlow)}명` }],
      [{ text: "게재 기간" }, { text: `${exposure.displayDays}일` }],
      [{ text: "예상 총 노출량" }, { text: `${formatNumber(exposure.totalExposure)}명` }],
    ];
    slide2.addTable(summaryRows, {
      x: 0.5,
      y: 1.0,
      w: 9,
      colW: [2.5, 6],
      fontSize: 14,
      border: { pt: 0.5, type: "solid", color: "CCCCCC" },
      ...fontOpt,
    });
    slide2.addText(
      "※ 본 노출량은 서울교통공사 등 공공데이터의 역별 승·하차 인구를 기반으로 한 추정치이며, 실제 광고 노출 수와는 차이가 있을 수 있습니다.",
      {
        x: 0.5,
        y: 2.8,
        w: 9,
        h: 0.8,
        fontSize: 10,
        color: "666666",
        align: "left",
        ...fontOpt,
      }
    );
  }

  // ——— 슬라이드 3: 시간대별 (있을 때만, 템플릿 없음) ———
  if (exposure.byTimeBand && exposure.byTimeBand.length > 0) {
    const slide3 = pptx.addSlide();
    slide3.addText("시간대별 예상 노출량", {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 22,
      bold: true,
      ...fontOpt,
    });
    const timeRows: { text: string }[][] = [
      [{ text: "시간대" }, { text: "예상 노출량" }],
      ...exposure.byTimeBand.map((b) => [
        { text: b.band },
        { text: `${formatNumber(b.exposure)}명` },
      ]),
    ];
    slide3.addTable(timeRows, {
      x: 0.5,
      y: 1.0,
      w: 9,
      colW: [2, 5],
      fontSize: 12,
      border: { pt: 0.5, type: "solid", color: "CCCCCC" },
      ...fontOpt,
    });
  }

  // ——— 슬라이드 4~: 촬영 광고 사진 (슬라이드당 2장, 종횡비 유지) ———
  if (imageBase64s && imageBase64s.length > 0) {
    const photoW = 4.5;
    const photoH = 3.375; // 4:3
    const pairs: string[][] = [];
    for (let i = 0; i < imageBase64s.length; i += 2) {
      pairs.push(imageBase64s.slice(i, i + 2));
    }
    for (const pair of pairs) {
      const slide = pptx.addSlide();
      if (tBanner) {
        slide.background = { data: tBanner.data };
      }
      pair.forEach((data, idx) => {
        const dataStr = data.startsWith("data:")
          ? data.slice(5)
          : data.includes(";")
            ? data
            : `image/jpeg;base64,${data}`;
        const x = idx === 0 ? 0.4 : 5.1;
        slide.addImage({
          data: dataStr,
          x,
          y: 1.2,
          w: photoW,
          h: photoH,
        });
      });
    }
  }

  // ——— 마지막: 문서 끝 ———
  const slideEnd = pptx.addSlide();
  if (tEnd) {
    slideEnd.background = { data: tEnd.data };
    slideEnd.addText(
      `케이티 나스미디어 ${campaignManagerName ?? ""}`,
      {
        x: 3,
        y: 2.4,
        w: 4,
        h: 0.5,
        fontSize: 18,
        align: "center",
        color: "FFFFFF",
        ...fontOpt,
      }
    );
    slideEnd.addText(campaignManagerEmail ?? "", {
      x: 3,
      y: 2.95,
      w: 4,
      h: 0.4,
      fontSize: 14,
      align: "center",
      color: "FFFFFF",
      ...fontOpt,
    });
  } else {
    slideEnd.addText("문서 끝", {
      x: 0.5,
      y: 2,
      w: 9,
      h: 0.5,
      fontSize: 22,
      bold: true,
      align: "center",
      ...fontOpt,
    });
    if (campaignManagerName || campaignManagerEmail) {
      slideEnd.addText(
        [campaignManagerName, campaignManagerEmail].filter(Boolean).join(" · "),
        {
          x: 0.5,
          y: 2.6,
          w: 9,
          h: 0.4,
          fontSize: 14,
          align: "center",
          ...fontOpt,
        }
      );
    }
  }

  const out = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}
