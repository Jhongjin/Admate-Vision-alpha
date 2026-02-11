/**
 * Resend를 이용한 보고 메일 발송.
 * - 수신자: 광고주 담당자 선택 시 참조에 캠페인 담당자 / 캠페인 담당자 선택 시 참조 공란
 * - 제목: {광고주명}_{호선}_{역명}_{사용자입력정보}_{년월일} 게첨 보고서의 건
 * - 본문: 나스미디어 {로그인사용자이름 or 캠페인담당자이름} + 발신전용 안내
 * - From: 발신전용(noreply) 주소
 */

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "나스미디어 보고 <onboarding@resend.dev>";

export type PrimaryRecipient = "advertiser" | "campaign";
export type SenderNameOption = "user" | "campaign";

export type ReportEmailParams = {
  /** 수신 1: 광고주 담당자(이메일) / 캠페인 담당자(이메일) */
  primaryRecipient: PrimaryRecipient;
  /** 발신자 표기: 로그인 사용자 이름 / 캠페인 담당자 이름 */
  senderNameOption: SenderNameOption;
  /** 광고주 이메일 (광고주 담당자) */
  advertiserEmail: string;
  /** 캠페인 담당자 이메일 */
  campaignManagerEmail: string;
  /** 캠페인 담당자 이름 */
  campaignManagerName: string;
  /** 캠페인 담당자 이름 영문 표기 (푸터 상단 이름용, 선택) */
  campaignManagerNameEn?: string;
  /** 로그인 사용자 이름 (발신자 표기용) */
  loginUserName: string;
  /** 광고주명 */
  advertiserName: string;
  /** 지하철 호선 */
  line: string;
  /** 지하철 역명 */
  station: string;
  /** 사용자직접기입명 (사진 파일명에서 추출) */
  userEnteredName: string;
  /** 년월일 (yyyyMMdd) */
  dateStr: string;
  /** ZIP 첨부 (base64). 없으면 첨부 안 함 */
  zipBase64?: string;
  /** ZIP 파일명 */
  zipFilename?: string;
  /** PDF 보고서 첨부 (AI 성과 분석). 없으면 첨부 안 함 */
  pdfAttachment?: { filename: string; buffer: Buffer };
  /** AI 분석 리포트 URL */
  reportUrl?: string;
  /** 다중 역 목록 (2개 이상일 때만 전달) */
  visits?: { station: string; line: string }[];
};

function safeFilenamePart(s: string): string {
  return s.replace(/[/\\:*?"<>|]/g, "_").trim() || "-";
}

export function buildReportSubject(params: ReportEmailParams): string {
  const { advertiserName, line, station, userEnteredName, dateStr, visits } = params;

  const a = safeFilenamePart(advertiserName);

  // 다중 역인 경우 간결한 제목
  if (visits && visits.length > 1) {
    const l = safeFilenamePart(line);
    return `${a}_${l}_${visits.length}개역_${dateStr} 게첨 보고서의 건`;
  }

  // 위치(역명)가 없는 경우 깔끔한 제목 사용
  if (!station || station === "미인식" || station === "") {
    return `${a}_${dateStr} 게첨 보고서의 건`;
  }

  const l = safeFilenamePart(line);
  const st = safeFilenamePart(station);
  const u = safeFilenamePart(userEnteredName);
  // userEnteredName이 없거나 '-' 인 경우 생략
  if (!userEnteredName || userEnteredName === "-") {
    return `${a}_${l}_${st}_${dateStr} 게첨 보고서의 건`;
  }
  return `${a}_${l}_${st}_${u}_${dateStr} 게첨 보고서의 건`;
}

export function buildReportBody(params: ReportEmailParams): string {
  const { senderNameOption, loginUserName, campaignManagerName, campaignManagerEmail, reportUrl, visits } = params;
  const senderName =
    senderNameOption === "user" ? loginUserName || "나스미디어" : campaignManagerName;
  let body = `안녕하세요.

나스미디어 ${senderName} 입니다. 게첨 보고서 전달 드립니다.
해당 메일은 발신전용으로 관련사항에 대한 문의는 ${campaignManagerName} (${campaignManagerEmail}) 로 회신 부탁 드립니다.
`;

  // 다중 역 목록 표시
  if (visits && visits.length > 1) {
    body += `\n촬영 역 목록 (${visits.length}개):\n`;
    visits.forEach((v, i) => {
      body += `  ${i + 1}. ${v.station} (${v.line})\n`;
    });
  }

  if (reportUrl) {
    body += `
[AI 성과 분석 리포트 확인하기]
${reportUrl}
`;
  }

  body += `
감사합니다.
${senderName} 드림`;

  return body;
}

const MEDIA_ARCHIVE_URL = "https://www.nasmedia.co.kr/%EB%82%98%EC%8A%A4%EB%A6%AC%ED%8F%AC%ED%8A%B8/%EB%AF%B8%EB%94%94%EC%96%B4-%EC%95%84%EC%B9%B4%EC%9D%B4%EB%B8%8C/";
const TREND_ARCHIVE_URL = "https://www.nasmedia.co.kr/%EB%82%98%EC%8A%A4%EB%A6%AC%ED%8F%AC%ED%8A%B8/%EC%A0%95%EA%B8%B0%EB%B3%B4%EA%B3%A0%EC%84%9C/";
const KT_NASMEDIA_LOGO_URL = "https://studio.nasmedia.co.kr/mail/images/kt-nasmedia_CI.png";
const KT_NASMEDIA_LINK = "https://www.nasmedia.co.kr/";

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** 본문(텍스트)을 HTML로 감싼 뒤 푸터를 붙인 HTML 문자열 반환 */
export function buildReportHtml(params: ReportEmailParams): string {
  const textBody = buildReportBody(params);
  const lines = textBody.split("\n").map((line) => escapeHtml(line));
  const bodyHtml = lines.join("<br>\n");

  const { campaignManagerName, campaignManagerNameEn } = params;
  const nameDisplay = campaignManagerNameEn
    ? `${escapeHtml(campaignManagerName)} <span style="font-size:14px;font-weight:normal;color:#333;">${escapeHtml(campaignManagerNameEn)}</span>`
    : escapeHtml(campaignManagerName);

  const logoImg = `<img src="${KT_NASMEDIA_LOGO_URL}" alt="kt nasmedia" width="120" height="28" style="display:block;max-height:28px;width:auto;" />`;
  const logoLink = `<a href="${KT_NASMEDIA_LINK}" target="_blank" rel="noopener" style="text-decoration:none;">${logoImg}</a>`;

  /** 이메일 푸터 고정 너비 (일반 메일 폼 표준 600px) */
  const FOOTER_WIDTH_PX = 600;
  const footerHtml = `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:32px;margin-bottom:0;">
  <tr>
    <td style="width:${FOOTER_WIDTH_PX}px;max-width:${FOOTER_WIDTH_PX}px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-top:1px solid #1a1a1a;width:${FOOTER_WIDTH_PX}px;max-width:${FOOTER_WIDTH_PX}px;">
        <tr>
          <td style="padding:12px 0 0 0;font-size:15px;font-weight:bold;color:#111;vertical-align:top;">${nameDisplay}</td>
          <td align="right" style="padding:12px 0 0 0;vertical-align:top;">${logoLink}</td>
        </tr>
        <tr>
          <td colspan="2" style="padding:10px 0 0 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#f3f4f6;border-radius:6px;padding:10px 12px;">
              <tr>
                <td style="font-size:12px;font-weight:bold;color:#374151;padding:0 6px 0 0;white-space:nowrap;">Media Archive</td>
                <td style="font-size:11px;color:#6b7280;padding:0 4px;">온모바일 | IPTV | OOH | 모바일광고플랫폼</td>
                <td align="right" style="white-space:nowrap;padding-left:4px;">
                  <a href="${MEDIA_ARCHIVE_URL}" style="display:inline-block;padding:6px 12px;background-color:#ea580c;color:#fff;text-decoration:none;font-size:11px;font-weight:500;border-radius:4px;">바로가기</a>
                </td>
              </tr>
              <tr>
                <td colspan="3" style="height:8px;"></td>
              </tr>
              <tr>
                <td style="font-size:12px;font-weight:bold;color:#374151;padding:0 6px 0 0;white-space:nowrap;">Trend Archive</td>
                <td style="font-size:11px;color:#6b7280;padding:0 4px;">마케터라면 알아야 할 디지털 트렌드와 이슈</td>
                <td align="right" style="white-space:nowrap;padding-left:4px;">
                  <a href="${TREND_ARCHIVE_URL}" style="display:inline-block;padding:6px 12px;background-color:#ea580c;color:#fff;text-decoration:none;font-size:11px;font-weight:500;border-radius:4px;">바로가기</a>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

  return `
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="font-family:Malgun Gothic,Apple SD Gothic Neo,sans-serif;font-size:14px;line-height:1.6;color:#333;">
  <tr>
    <td style="max-width:${FOOTER_WIDTH_PX}px;">
      <div style="max-width:${FOOTER_WIDTH_PX}px;">${bodyHtml}</div>
      ${footerHtml}
    </td>
  </tr>
</table>`;
}

export async function sendReportEmail(params: ReportEmailParams): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY가 설정되지 않았습니다." };
  }

  const to =
    params.primaryRecipient === "advertiser"
      ? params.advertiserEmail
      : params.campaignManagerEmail;
  const cc = params.primaryRecipient === "advertiser" ? [params.campaignManagerEmail] : [];

  const subject = buildReportSubject(params);
  const textBody = buildReportBody(params);
  const htmlBody = buildReportHtml(params);

  const resend = new Resend(RESEND_API_KEY);

  const attachments: { filename: string; content: Buffer }[] = [];
  if (params.zipBase64 && params.zipFilename) {
    attachments.push({
      filename: params.zipFilename,
      content: Buffer.from(params.zipBase64, "base64"),
    });
  }
  if (params.pdfAttachment) {
    attachments.push({
      filename: params.pdfAttachment.filename,
      content: params.pdfAttachment.buffer,
    });
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      cc: cc.length > 0 ? cc : undefined,
      subject,
      text: textBody,
      html: htmlBody,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const message = e instanceof Error ? e.message : "이메일 발송 중 오류가 발생했습니다.";
    return { ok: false, error: message };
  }
}
