/**
 * 회원가입 이메일 인증 메일 발송 (Resend)
 */

import { Resend } from "resend";

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? "";
// 보고 메일과 동일한 발신 주소 사용 (도메인 인증 시 @nasmedia.co.kr 등 사용)
const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "나스미디어 보고 <onboarding@resend.dev>";

function getBaseUrl(): string {
  // 커스텀 도메인(예: vision-ooh.admate.ai.kr) 사용 시 NEXT_PUBLIC_APP_URL 설정 권장
  const app = process.env.NEXT_PUBLIC_APP_URL;
  if (app) return app.replace(/\/$/, "");
  const vercel = process.env.VERCEL_URL;
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}

export type SendVerificationEmailParams = {
  to: string;
  token: string;
  name?: string;
};

export async function sendVerificationEmail(
  params: SendVerificationEmailParams
): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "RESEND_API_KEY가 설정되지 않았습니다." };
  }

  const baseUrl = getBaseUrl();
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${encodeURIComponent(params.token)}`;
  const name = params.name?.trim() || "회원";

  const subject = "[AdMate Vision] 이메일 인증을 완료해 주세요";
  const text = `안녕하세요, ${name}님.

AdMate Vision 회원가입을 완료하려면 아래 링크를 클릭해 주세요.

${verifyUrl}

이 링크는 24시간 동안 유효합니다.
본인이 요청한 것이 아니면 이 메일을 무시하셔도 됩니다.`;

  const resend = new Resend(RESEND_API_KEY);

  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [params.to],
      subject,
      text,
    });

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (e) {
    const message =
      e instanceof Error ? e.message : "이메일 발송 중 오류가 발생했습니다.";
    return { ok: false, error: message };
  }
}
