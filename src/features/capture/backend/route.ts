import type { Hono } from "hono";
import { z } from "zod";
import { getSupabase, type AppEnv } from "@/backend/hono/context";
import { getAdvertiserById } from "@/features/advertisers/backend/service";
import { runGoogleVisionOcr } from "./ocr-service";
import { sendReportEmail } from "./report-email";
import { fetchStationFlow } from "./report-exposure/public-data-service";
import { calculateExposure } from "./report-exposure/exposure-calc";
import { generateReportPdf } from "./report-exposure/pdf-generator";
import { extractImageBase64sFromZip } from "./report-exposure/zip-to-images";
import { generateAiAnalysis, type AiAnalysisResult } from "./ai-analysis-service";

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
  /** AI 성과 분석 건너뛰기(타임아웃 시 사용자 선택용) */
  skipAiAnalysis: z.boolean().optional(),
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

    // Fetch advertiser hints for Gemini
    const supabase = getSupabase(c);
    const { data: advList } = await supabase
      .from("vision_ocr_advertisers")
      .select("name, search_terms");

    const hints: string[] = [];
    if (advList) {
      for (const row of advList) {
        hints.push(row.name);
        if (row.search_terms && Array.isArray(row.search_terms)) {
          hints.push(...row.search_terms);
        }
      }
    }

    const result = await runGoogleVisionOcr(imageDataUrl, hints); // Now uses Gemini

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
      textForStation: result.textForStation,
      // Add extra fields for client auto-fill if client supports it
      advertiserName: result.advertiserName,
      line: result.line,
    });
  });

  /** 보고 발송 (Resend 이메일 + ZIP 첨부) */
  app.post("/capture/report", async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const parsed = ReportBodySchema.safeParse(body);
      if (!parsed.success) {
        return c.json({ ok: false, error: "INVALID_BODY", message: "Invalid report payload" }, 400);
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

      let exposure: { totalExposure: number; dailyFlow: number } | undefined;
      const imageBase64s = payload.zipBase64
        ? await extractImageBase64sFromZip(payload.zipBase64)
        : [];

      // Calculate exposure for PDF (replacing PPT logic)
      if (payload.station && payload.line) {
        const flowResult = await fetchStationFlow(payload.station, payload.line);
        if (flowResult.ok) {
          const displayDays = payload.displayDays ?? 7;
          exposure = calculateExposure({
            flowData: flowResult.data,
            displayDays,
          });
        }
      }


      const sentToEmail =
        payload.primaryRecipient === "advertiser" ? adv.email : adv.campaignManagerEmail;

      /** Gemini 호출 타임아웃(ms). Vercel Pro(5분) 환경이므로 3분까지 대기. */
      const AI_ANALYSIS_TIMEOUT_MS = 180_000;
      let aiAnalysisData: AiAnalysisResult | null = null;
      console.log('station', payload.station)
      console.log('line', payload.line)
      console.log('advertiserName', payload.advertiserName)
      console.log('skipAiAnalysis', payload.skipAiAnalysis)
      if (payload.station && payload.line && payload.advertiserName && !payload.skipAiAnalysis) {
        try {
          aiAnalysisData = await Promise.race([
            generateAiAnalysis({
              station: payload.station,
              line: payload.line,
              advertiserName: payload.advertiserName,
              dateStr,
            }),
            new Promise<never>((_, reject) =>
              setTimeout(() => reject(new Error("AI_ANALYSIS_TIMEOUT")), AI_ANALYSIS_TIMEOUT_MS)
            ),
          ]);
        } catch (e) {
          const isTimeout = e instanceof Error && e.message === "AI_ANALYSIS_TIMEOUT";
          if (isTimeout) {
            return c.json(
              {
                ok: false,
                error: "AI_ANALYSIS_TIMEOUT",
                message: "AI 성과 분석 생성이 시간 초과되었습니다. 다시 시도하거나 AI 분석 없이 발송할 수 있습니다.",
              },
              200
            );
          }
          console.error("[capture/report] AI Analysis failed:", e);
          aiAnalysisData = null;
        }
      }
      // Generate PDF
      let pdfAttachment: { filename: string; buffer: Buffer } | undefined;
      try {
        const safeStation = payload.station?.replace(/[/\\:*?"<>|]/g, "_").trim() || "역";
        const safeLine = (payload.line ?? "").replace(/[/\\:*?"<>|]/g, "_").trim() || "호선";

        const pdfBuffer = await generateReportPdf({
          advertiserName: payload.advertiserName ?? adv.name,
          station: payload.station ?? "",
          line: payload.line ?? "",
          dateStr,
          aiAnalysis: aiAnalysisData,
          imageBase64s: imageBase64s,
          exposure: exposure ? {
            totalExposure: exposure.totalExposure,
            dailyFlow: exposure.dailyFlow,
          } : undefined,
        });

        pdfAttachment = {
          filename: `성과분석보고_${payload.advertiserName ?? adv.name}_${safeLine}_${safeStation}_${dateStr}.pdf`,
          buffer: pdfBuffer,
        };
      } catch (pdfErr) {
        console.error("[capture/report] PDF 생성 실패:", pdfErr);
      }


      const { data: insertedReport, error: insertErr } = await supabase.from("vision_ocr_reports").insert({
        advertiser_id: payload.advertiserId,
        advertiser_name: payload.advertiserName ?? adv.name,
        station: payload.station ?? null,
        line: payload.line ?? null,
        location_label: payload.locationLabel ?? payload.userEnteredName ?? null,
        image_count: payload.imageCount ?? null,
        sent_to_email: sentToEmail ?? null,
        ai_analysis: aiAnalysisData,
      }).select().single();

      if (insertErr || !insertedReport) {
        console.error("[capture/report] vision_ocr_reports insert failed:", insertErr);
        return c.json({
          ok: false,
          error: "DB_INSERT_FAILED",
          message: "리포트 저장 중 오류가 발생했습니다.",
        }, 500);
      }

      // 4. 이미지 스토리지 업로드 및 URL 업데이트
      let imageUrls: string[] = [];
      try {
        if (imageBase64s.length > 0) {
          // Ensure bucket exists and is public
          await supabase.storage.createBucket("report-images", { public: true })
            .catch(() => supabase.storage.updateBucket("report-images", { public: true }))
            .catch((e) => console.warn("Bucket setup warning:", e));

          const uploadPromises = imageBase64s.map(async (base64, index) => {
            // base64 might be data URI or raw base64
            const rawBase64 = base64.includes(",") ? base64.split(",")[1] : base64;
            if (!rawBase64) {
              console.warn(`[capture/report] Empty base64 for image ${index}`);
              return null;
            }

            const buffer = Buffer.from(rawBase64, "base64");
            // 파일명: {reportId}/{index}.jpg
            const path = `${insertedReport.id}/${index}.jpg`;
            const { error: uploadErr } = await supabase.storage
              .from("report-images")
              .upload(path, buffer, {
                contentType: "image/jpeg",
                upsert: true,
              });

            if (uploadErr) {
              console.error(`[capture/report] Image upload failed (${index}):`, uploadErr);
              return null;
            }

            const { data: publicUrlData } = supabase.storage
              .from("report-images")
              .getPublicUrl(path);

            return publicUrlData.publicUrl;
          });

          const results = await Promise.all(uploadPromises);
          imageUrls = results.filter((url): url is string => url !== null);

          if (imageUrls.length > 0) {
            // 1. Try updating standard column
            const { error: updateErr } = await supabase
              .from("vision_ocr_reports")
              .update({ image_urls: imageUrls })
              .eq("id", insertedReport.id);

            // 2. Fallback: If column update failed (e.g. migration missing), save to ai_analysis JSON
            if (updateErr && aiAnalysisData) {
              console.warn("[capture/report] image_urls column update failed, falling back to ai_analysis:", updateErr);
              const fallbackData = {
                ...aiAnalysisData,
                image_urls: imageUrls,
                debug_error: {
                  message: "Column Update Failed",
                  details: updateErr.message
                }
              };
              await supabase
                .from("vision_ocr_reports")
                .update({ ai_analysis: fallbackData })
                .eq("id", insertedReport.id);
            }
          }
        }
      } catch (uploadOrUpdateErr: any) {
        console.error("[capture/report] Image upload/update failed:", uploadOrUpdateErr);
        // 에러 내용을 DB에 저장하여 프론트엔드에서 확인 가능하게 함
        if (insertedReport && aiAnalysisData) {
          const errorMsg = uploadOrUpdateErr instanceof Error ? uploadOrUpdateErr.message : String(uploadOrUpdateErr);
          const debugData = {
            ...aiAnalysisData,
            debug_error: {
              message: "Image Upload Failed",
              details: errorMsg,
              check: "Check Vercel Logs or Storage Permissions"
            }
          };
          await supabase.from("vision_ocr_reports")
            .update({ ai_analysis: debugData })
            .eq("id", insertedReport.id);
        }
      }

      const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://vision-ooh.admate.ai.kr");
      const reportUrl = `${baseUrl}/reports/analysis/${insertedReport.id}`;

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
        pdfAttachment,
        reportUrl,
      });

      if (!result.ok) {
        // 이메일 발송 실패 시... 로그만 남기고 일단 성공 처리? 아니면 에러 리턴?
        // 사용자는 "발송 실패"로 알아야 함.
        return c.json({
          ok: false,
          error: "EMAIL_SEND_FAILED",
          message: result.error ?? "이메일 발송에 실패했습니다. (DB에는 저장됨)",
          savedToHistory: true,
        }, 200); // 클라이언트가 '성공(저장됨)'으로 처리하고 리다이렉트할 수 있도록 200 반환
      }

      return c.json({
        ok: true,
        message: "보고 메일이 발송되었습니다.",
        savedToHistory: true,
      });
    } catch (err) {
      console.error("[capture/report] Unhandled error:", err);
      const message = err instanceof Error ? err.message : "서버 오류가 발생했습니다.";
      return c.json({ ok: false, error: "INTERNAL_ERROR", message }, 500);
    }
  });

  /** AI 성과 분석 웹 미리보기용 (로컬/형태 확인) — Gemini 호출 후 리포트와 동일한 형태로 반환 */
  app.get("/capture/ai-analysis-preview", async (c) => {
    const sample = {
      station: "강남",
      line: "2호선",
      advertiserName: "테스트 광고주",
      dateStr: new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    };
    try {
      const ai_analysis = await generateAiAnalysis(sample);
      const now = new Date().toISOString();
      return c.json({
        id: "preview",
        advertiser_name: sample.advertiserName,
        station: sample.station,
        line: sample.line,
        location_label: null,
        ai_analysis,
        created_at: now,
        sent_at: now,
        vision_ocr_advertisers: {
          campaign_manager_name: "캠페인 담당자 (샘플)",
          campaign_manager_email: "campaign@example.com",
          contact_name: null,
        },
      });
    } catch (e) {
      console.error("[capture/ai-analysis-preview]", e);
      return c.json({ error: "PREVIEW_FAILED", message: "미리보기 생성 실패" }, 500);
    }
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

  /** 보고서 상세 및 AI 분석 결과 조회 */
  app.get("/reports/:id", async (c) => {
    const reportId = c.req.param("id");
    const supabase = getSupabase(c);
    const { data, error } = await supabase
      .from("vision_ocr_reports")
      .select("*, vision_ocr_advertisers(campaign_manager_name, campaign_manager_email, contact_name)")
      .eq("id", reportId)
      .single();
    if (error) {
      return c.json({ error: "DB_ERROR", message: error.message }, 500);
    }
    return c.json(data);
  });
};
