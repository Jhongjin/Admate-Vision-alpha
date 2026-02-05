import type { Hono } from "hono";
import { z } from "zod";
import { getSupabase, type AppEnv } from "@/backend/hono/context";
import { getAdvertiserById } from "@/features/advertisers/backend/service";
import { runGoogleVisionOcr } from "./ocr-service";
import { sendReportEmail } from "./report-email";
import { fetchStationFlow } from "./report-exposure/public-data-service";
import { calculateExposure } from "./report-exposure/exposure-calc";
import { generateReportPpt } from "./report-exposure/ppt-generator";

/** OCR API rate limit: 분당 최대 요청 수 (IP당) */
const OCR_RATE_LIMIT_PER_MIN = 30;
const ocrRequestCounts = new Map<string, { count: number; resetAt: number }>();

function getClientId(c: { req: { raw: Request } }): string {
  const forwarded = c.req.raw.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return c.req.raw.headers.get("x-real-ip") ?? "unknown";
}

function checkOcrRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  let entry = ocrRequestCounts.get(clientId);
  if (!entry || now >= entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs };
    ocrRequestCounts.set(clientId, entry);
    return true;
  }
  if (entry.count >= OCR_RATE_LIMIT_PER_MIN) return false;
  entry.count += 1;
  return true;
}

const OcrBodySchema = z.object({
  imageDataUrl: z.string().min(1, "imageDataUrl is required"),
});

/** 보고 발송 요청 스키마 (Resend 이메일 연동) */
const ReportBodySchema = z.object({
  advertiserId: z.string().uuid().optional(),
  advertiserName: z.string().optional(),
  primaryRecipient: z.enum(["advertiser", "campaign"]).default("campaign"),
  senderNameOption: z.enum(["user", "campaign"]).default("user"),
  loginUserName: z.string().optional(),
  userEnteredName: z.string().optional(),
  station: z.string().optional(),
  line: z.string().optional(),
  locationLabel: z.string().optional(),
  imageCount: z.number().int().min(0).optional(),
  skipLocation: z.boolean().optional(),
  dateStr: z.string().optional(),
  zipBase64: z.string().optional(),
  zipFilename: z.string().optional(),
  /** PPT 노출량 보고서 포함 여부 */
  includePpt: z.boolean().optional(),
  /** 게재 기간(일수). includePpt 시 노출량 계산에 사용. 기본 7 */
  displayDays: z.number().int().min(1).max(365).optional(),
}).passthrough();

export const registerCaptureRoutes = (app: Hono<AppEnv>) => {
  app.post("/capture/ocr", async (c) => {
    const clientId = getClientId(c);
    if (!checkOcrRateLimit(clientId)) {
      return c.json(
        { error: "RATE_LIMIT", message: "OCR 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." },
        429
      );
    }
    const body = await c.req.json().catch(() => ({}));
    const parsed = OcrBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: "INVALID_BODY", message: "imageDataUrl is required" },
        400
      );
    }
    const { imageDataUrl } = parsed.data;
    const result = await runGoogleVisionOcr(imageDataUrl);

    if (result == null) {
      return c.json(
        {
          error: "SERVER_OCR_UNAVAILABLE",
          message: "Server OCR is not configured or failed.",
        },
        503
      );
    }

    return c.json({
      text: result.text,
      confidence: result.confidence,
    });
  });

  /** 보고 발송 (Resend 이메일 + ZIP 첨부) */
  app.post("/capture/report", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const parsed = ReportBodySchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: "INVALID_BODY", message: "Invalid report payload" }, 400);
    }
    const payload = parsed.data;

    if (!payload.advertiserId) {
      return c.json({
        ok: false,
        error: "ADVERTISER_REQUIRED",
        message: "광고주 정보가 없어 이메일 발송을 할 수 없습니다. 광고주가 인식된 촬영만 보고 발송할 수 있습니다.",
      }, 400);
    }

    const supabase = getSupabase(c);
    const advResult = await getAdvertiserById(supabase, payload.advertiserId);
    if (!advResult.ok) {
      return c.json({
        ok: false,
        error: "ADVERTISER_NOT_FOUND",
        message: "광고주를 찾을 수 없습니다.",
      }, 404);
    }
    const adv = advResult.data;

    const dateStr = payload.dateStr ?? new Date().toISOString().slice(0, 10).replace(/-/g, "");

    let pptAttachment: { filename: string; buffer: Buffer } | undefined;
    if (payload.includePpt && payload.station && payload.line) {
      const flowResult = await fetchStationFlow(payload.station, payload.line);
      if (flowResult.ok) {
        const displayDays = payload.displayDays ?? 7;
        const exposure = calculateExposure({
          flowData: flowResult.data,
          displayDays,
        });
        try {
          const pptBuffer = await generateReportPpt({
            advertiserName: payload.advertiserName ?? adv.name,
            station: payload.station,
            line: payload.line,
            displayDays,
            exposure,
            subtitle: payload.userEnteredName ?? undefined,
            dateStr,
          });
          const safeStation = payload.station.replace(/[/\\:*?"<>|]/g, "_").trim() || "역";
          const safeLine = (payload.line ?? "").replace(/[/\\:*?"<>|]/g, "_").trim() || "호선";
          pptAttachment = {
            filename: `노출량보고_${payload.advertiserName ?? adv.name}_${safeLine}_${safeStation}_${dateStr}.pptx`,
            buffer: pptBuffer,
          };
        } catch (pptErr) {
          console.error("[capture/report] PPT 생성 실패:", pptErr);
        }
      }
    }

    const result = await sendReportEmail({
      primaryRecipient: payload.primaryRecipient as "advertiser" | "campaign",
      senderNameOption: payload.senderNameOption as "user" | "campaign",
      advertiserEmail: adv.email,
      campaignManagerEmail: adv.campaignManagerEmail,
      campaignManagerName: adv.campaignManagerName,
      loginUserName: payload.loginUserName ?? "",
      advertiserName: payload.advertiserName ?? adv.name,
      line: payload.line ?? "",
      station: payload.station ?? "",
      userEnteredName: payload.userEnteredName ?? "",
      dateStr,
      zipBase64: payload.zipBase64,
      zipFilename: payload.zipFilename,
      pptAttachment,
    });

    if (!result.ok) {
      return c.json({
        ok: false,
        error: "EMAIL_SEND_FAILED",
        message: result.error ?? "이메일 발송에 실패했습니다.",
      }, 500);
    }

    const sentToEmail =
      payload.primaryRecipient === "advertiser" ? adv.email : adv.campaignManagerEmail;
    const { error: insertErr } = await supabase.from("vision_ocr_reports").insert({
      advertiser_id: payload.advertiserId,
      advertiser_name: payload.advertiserName ?? adv.name,
      station: payload.station ?? null,
      line: payload.line ?? null,
      location_label: payload.locationLabel ?? payload.userEnteredName ?? null,
      image_count: payload.imageCount ?? null,
      sent_to_email: sentToEmail ?? null,
    });
    if (insertErr) {
      console.error("[capture/report] vision_ocr_reports insert failed:", insertErr);
    }

    return c.json({
      ok: true,
      message: "보고 메일이 발송되었습니다.",
      savedToHistory: !insertErr,
      ...(insertErr && { savedToHistoryError: insertErr.message }),
    });
  });

  /** 보고 발송 이력 목록 (최신순) */
  app.get("/reports", async (c) => {
    const supabase = getSupabase(c);
    const { data, error } = await supabase
      .from("vision_ocr_reports")
      .select("id, advertiser_id, advertiser_name, station, line, location_label, image_count, sent_at, sent_to_email")
      .order("sent_at", { ascending: false });
    if (error) {
      return c.json({ error: "DB_ERROR", message: error.message }, 500);
    }
    return c.json({ reports: data ?? [] });
  });
};
