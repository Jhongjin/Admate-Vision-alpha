/**
 * Phase 4: 노출량 보고서 PPT 생성 (pptxgenjs).
 * 표지 + 노출량 요약 + 시간대별 표 + 촬영 이미지 슬라이드.
 */

import PptxGenJS from "pptxgenjs";
import type { ReportPptParams } from "./types";

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}백만`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}만`;
  return n.toLocaleString();
}

/**
 * 노출량 보고서 PPT 생성. Buffer 반환 (메일 첨부용).
 */
export async function generateReportPpt(params: ReportPptParams): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_16x9";
  pptx.title = `게재 현황 보고서 - ${params.advertiserName}`;
  pptx.author = "AdMate Vision";

  const { advertiserName, station, line, displayDays, exposure, imageBase64s, subtitle, dateStr } =
    params;

  // 슬라이드 1: 표지
  const slide1 = pptx.addSlide();
  slide1.addText(`${advertiserName} 게재 현황 보고서`, {
    x: 0.5,
    y: 1.2,
    w: 9,
    h: 0.8,
    fontSize: 28,
    bold: true,
    align: "center",
  });
  slide1.addText(`${line} ${station}${subtitle ? ` · ${subtitle}` : ""}`, {
    x: 0.5,
    y: 2.0,
    w: 9,
    h: 0.4,
    fontSize: 18,
    align: "center",
  });
  if (dateStr) {
    slide1.addText(`보고 일자: ${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`, {
      x: 0.5,
      y: 2.6,
      w: 9,
      h: 0.35,
      fontSize: 14,
      align: "center",
    });
  }

  // 슬라이드 2: 노출량 요약
  const slide2 = pptx.addSlide();
  slide2.addText("예상 노출량 요약", {
    x: 0.5,
    y: 0.3,
    w: 9,
    h: 0.5,
    fontSize: 22,
    bold: true,
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
  });

  // 슬라이드 3: 시간대별 (있을 때만)
  if (exposure.byTimeBand && exposure.byTimeBand.length > 0) {
    const slide3 = pptx.addSlide();
    slide3.addText("시간대별 예상 노출량", {
      x: 0.5,
      y: 0.3,
      w: 9,
      h: 0.5,
      fontSize: 22,
      bold: true,
    });
    const timeRows: { text: string }[][] = [
      [{ text: "시간대" }, { text: "예상 노출량" }],
      ...exposure.byTimeBand.map((b) => [{ text: b.band }, { text: `${formatNumber(b.exposure)}명` }]),
    ];
    slide3.addTable(timeRows, {
      x: 0.5,
      y: 1.0,
      w: 9,
      colW: [2, 5],
      fontSize: 12,
      border: { pt: 0.5, type: "solid", color: "CCCCCC" },
    });
  }

  // 슬라이드 4~: 촬영 이미지
  if (imageBase64s && imageBase64s.length > 0) {
    for (let i = 0; i < imageBase64s.length; i++) {
      const slide = pptx.addSlide();
      slide.addText(`촬영 이미지 ${i + 1}`, {
        x: 0.5,
        y: 0.2,
        w: 9,
        h: 0.4,
        fontSize: 16,
        bold: true,
      });
      const data = imageBase64s[i]!;
      const dataStr = data.startsWith("data:") ? data.slice(5) : (data.includes(";") ? data : `image/jpeg;base64,${data}`);
      slide.addImage({
        data: dataStr,
        x: 0.5,
        y: 0.7,
        w: 9,
        h: 5,
      });
    }
  }

  const out = await pptx.write({ outputType: "nodebuffer" });
  return Buffer.isBuffer(out) ? out : Buffer.from(out as ArrayBuffer);
}
