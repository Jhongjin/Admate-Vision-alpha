"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MapPin, Building2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { CAPTURE_SESSION_KEY } from "@/features/capture/constants";
import type { CaptureSessionData } from "@/features/capture/constants";
import { DUMMY_ADVERTISERS } from "@/features/capture/data/dummy-advertisers";
import { extractTextFromImage } from "@/features/capture/lib/ocr";
import { matchOcrToAdvertiser } from "@/features/capture/lib/match-advertiser";
import { reverseGeocode } from "@/features/capture/lib/reverse-geocode";
import { format } from "date-fns";

const FALLBACK = {
  location: "위치 정보 없음",
  advertiser: "광고주 미인식",
};

export default function CaptureConfirmPage() {
  const [data, setData] = useState<CaptureSessionData | null>(null);
  const [addressLabel, setAddressLabel] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [advertiserLabel, setAdvertiserLabel] = useState<string | null>(null);
  const [advertiserLoading, setAdvertiserLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CAPTURE_SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CaptureSessionData;
        if (parsed.imageDataUrl) setData(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (data?.lat == null || data?.lng == null) return;
    setAddressLoading(true);
    setAddressLabel(null);
    reverseGeocode(data.lat, data.lng)
      .then((addr) => setAddressLabel(addr ?? null))
      .catch(() => setAddressLabel(null))
      .finally(() => setAddressLoading(false));
  }, [data?.lat, data?.lng]);

  useEffect(() => {
    if (!data?.imageDataUrl) return;
    setAdvertiserLoading(true);
    setAdvertiserLabel(null);

    const runOcrThenMatch = (ocrText: string) => {
      const match = matchOcrToAdvertiser(ocrText, DUMMY_ADVERTISERS);
      setAdvertiserLabel(match ? match.advertiserName : null);
    };

    const imageDataUrl = data.imageDataUrl;

    fetch("/api/capture/ocr", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageDataUrl }),
    })
      .then((res) => {
        if (res.ok) return res.json() as Promise<{ text: string }>;
        return Promise.reject(new Error("Server OCR unavailable"));
      })
      .then((body) => runOcrThenMatch(body.text))
      .catch(() =>
        extractTextFromImage(imageDataUrl).then((ocr) =>
          runOcrThenMatch(ocr.text)
        )
      )
      .catch(() => setAdvertiserLabel(null))
      .finally(() => setAdvertiserLoading(false));
  }, [data?.imageDataUrl]);

  const hasGps = data?.lat != null && data?.lng != null;
  const locationText = (() => {
    if (!hasGps) return FALLBACK.location;
    if (addressLoading) return "주소 조회 중...";
    if (addressLabel) return addressLabel;
    return `${data!.lat.toFixed(6)}, ${data!.lng.toFixed(6)}`;
  })();
  const accuracyText =
    hasGps && data?.accuracy != null
      ? ` · 약 ±${Math.round(data.accuracy)}m`
      : "";
  const mapsUrl =
    hasGps
      ? `https://www.google.com/maps?q=${data!.lat},${data!.lng}`
      : null;
  const capturedAtText = data?.capturedAt
    ? format(new Date(data.capturedAt), "yyyy-MM-dd HH:mm")
    : "-";

  return (
    <div className="container py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">촬영 확인</h1>
        <p className="mt-1 text-secondary-500">
          촬영 내용을 확인한 뒤 보고를 발송하세요.
        </p>
      </header>

      <Card className="overflow-hidden border-secondary-200">
        <div className="relative aspect-video w-full bg-gray-100">
          {data?.imageDataUrl ? (
            <img
              src={data.imageDataUrl}
              alt="촬영 이미지"
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-secondary-500">
              촬영 데이터가 없습니다. 촬영 화면에서 다시 촬영해 주세요.
            </div>
          )}
        </div>
        <CardHeader>
          <CardContent className="space-y-3 p-0">
            <div className="flex flex-col gap-1 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 shrink-0 text-secondary-500" />
                <span className="text-gray-700">
                  {locationText}
                  {accuracyText}
                </span>
              </div>
              {mapsUrl && (
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-500 hover:underline"
                >
                  지도에서 보기
                </a>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Building2 className="h-4 w-4 shrink-0 text-secondary-500" />
              <span className="text-gray-700">
                {advertiserLoading
                  ? "광고주 인식 중..."
                  : advertiserLabel ?? FALLBACK.advertiser}
              </span>
            </div>
            <p className="text-xs text-secondary-500">
              촬영 시각: {capturedAtText}
            </p>
          </CardContent>
        </CardHeader>
        <CardFooter className="flex gap-3 border-t border-secondary-200 pt-6">
          <Button asChild size="lg" className="gap-2">
            <Link href="/reports">
              <Send className="h-4 w-4" />
              보고 발송
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/capture">취소</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
