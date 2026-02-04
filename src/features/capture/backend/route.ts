import type { Hono } from "hono";
import { z } from "zod";
import type { AppEnv } from "@/backend/hono/context";
import { runGoogleVisionOcr } from "./ocr-service";

const OcrBodySchema = z.object({
  imageDataUrl: z.string().min(1, "imageDataUrl is required"),
});

export const registerCaptureRoutes = (app: Hono<AppEnv>) => {
  app.post("/api/capture/ocr", async (c) => {
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
};
