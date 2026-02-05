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
};

function safeFilenamePart(s: string): string {
  return s.replace(/[/\\:*?"<>|]/g, "_").trim() || "-";
}

export function buildReportSubject(params: ReportEmailParams): string {
  const { advertiserName, line, station, userEnteredName, dateStr } = params;
  const a = safeFilenamePart(advertiserName);
  const l = safeFilenamePart(line);
  const st = safeFilenamePart(station);
  const u = safeFilenamePart(userEnteredName);
  return `${a}_${l}_${st}_${u}_${dateStr} 게첨 보고서의 건`;
}

export function buildReportBody(params: ReportEmailParams): string {
  const { senderNameOption, loginUserName, campaignManagerName, campaignManagerEmail } = params;
  const senderName =
    senderNameOption === "user" ? loginUserName || "나스미디어" : campaignManagerName;
  const body = `안녕하세요. 나스미디어 ${senderName} 입니다. 게첨 보고서 전달 드립니다.

해당 메일은 발신전용으로 관련사항에 대한 문의는 ${campaignManagerName} (${campaignManagerEmail}) 로 회신 부탁 드립니다.`;
  return body;
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
  const body = buildReportBody(params);

  const resend = new Resend(RESEND_API_KEY);

  const attachments: { filename: string; content: Buffer }[] = [];
  if (params.zipBase64 && params.zipFilename) {
    attachments.push({
      filename: params.zipFilename,
      content: Buffer.from(params.zipBase64, "base64"),
    });
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      cc: cc.length > 0 ? cc : undefined,
      subject,
      text: body,
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
