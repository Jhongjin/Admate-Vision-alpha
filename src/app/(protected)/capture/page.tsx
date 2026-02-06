"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, MapPin, FileText, MapPinOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CAPTURE_SESSION_KEY,
  SESSION_STORAGE_WARN_IMAGE_COUNT,
  type AdCaptureItem,
  type CaptureSessionData,
} from "@/features/capture/constants";
import { matchOcrToAdvertiser } from "@/features/capture/lib/match-advertiser";
import { useAdvertisers } from "@/features/advertisers/hooks/useAdvertisers";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { extractTextFromImage } from "@/features/capture/lib/ocr";
import { compressDataUrl } from "@/features/capture/lib/compress-dataurl";
import { useToast } from "@/hooks/use-toast";

class OcrRateLimitError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OcrRateLimitError";
  }
}

function runOcr(imageDataUrl: string): Promise<string> {
  return fetch("/api/capture/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl }),
  })
    .then(async (res) => {
      if (res.ok) return res.json() as Promise<{ text: string }>;
      if (res.status === 429) {
        const body = await res.json().catch(() => ({}));
        throw new OcrRateLimitError(
          (body as { message?: string }).message ?? "OCR 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요."
        );
      }
      throw new Error("OCR unavailable");
    })
    .then((body) => body.text)
    .catch((err) => {
      if (err instanceof OcrRateLimitError) throw err;
      return extractTextFromImage(imageDataUrl).then((ocr) => ocr.text);
    });
}

const GPS_MAX_AGE_MS = 30_000;
/** 지하·실내(지하철 등)에서는 위성 대신 Wi-Fi/기지국 위치 사용을 위해 false */
const GPS_HIGH_ACCURACY = false;

type GpsStatus = "idle" | "loading" | "ready" | "error" | "unsupported";

export default function CapturePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const gpsPositionRef = useRef<{
    lat: number;
    lng: number;
    accuracy?: number;
    timestamp: number;
  } | null>(null);
  const {
    data: advertisersList,
    isLoading: advertisersLoading,
    isError: advertisersError,
  } = useAdvertisers();
  /** 광고주 매칭은 Supabase(API) 목록만 사용 */
  const advertisers = (advertisersList ?? []) as Parameters<typeof matchOcrToAdvertiser>[1];
  const { toast } = useToast();

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  /** 위치(지하철 역명) 사진 1장 */
  const [locationImage, setLocationImage] = useState<string | null>(null);
  /** 위치 없이 광고만 촬영 모드 */
  const [skipLocation, setSkipLocation] = useState(false);
  /** 광고물 사진 (최대 10장) */
  const [adImages, setAdImages] = useState<AdCaptureItem[]>([]);
  /** 매칭되는 광고주 없음 시트 */
  const [showNoAdvertiserSheet, setShowNoAdvertiserSheet] = useState(false);
  /** 매칭 실패한 이미지 (일단 저장 시 adImages에 추가) */
  const [pendingNoMatchImage, setPendingNoMatchImage] = useState<string | null>(null);

  const AD_MAX = 10;
  const isAdMode = locationImage != null || skipLocation;
  const canFinish = isAdMode && adImages.length >= 1;

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("이 브라우저는 카메라를 지원하지 않습니다.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }
      streamRef.current = stream;
      setStatus("ready");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "카메라 접근에 실패했습니다.";
      setErrorMessage(
        message.includes("Permission") || message.includes("권한")
          ? "카메라 권한을 허용해 주세요."
          : message
      );
      setStatus("error");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus("idle");
    setErrorMessage(null);
  }, []);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (status !== "ready" || !videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    video.srcObject = streamRef.current;
    video.setAttribute("playsinline", "true");
    video.muted = true;
    video.play().catch(() => { });
  }, [status]);

  useEffect(() => {
    if (status !== "ready") return;
    if (!navigator.geolocation?.getCurrentPosition) {
      setGpsStatus("unsupported");
      return;
    }
    setGpsStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        gpsPositionRef.current = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: Date.now(),
        };
        setGpsStatus("ready");
      },
      () => setGpsStatus("error"),
      {
        enableHighAccuracy: GPS_HIGH_ACCURACY,
        timeout: 12000,
        maximumAge: GPS_MAX_AGE_MS,
      }
    );
  }, [status]);

  const addCapturedImage = useCallback(
    (imageDataUrl: string) => {
      const now = new Date().toISOString();
      if (!skipLocation && locationImage == null) {
        setLocationImage(imageDataUrl);
        return;
      }
      if (adImages.length >= AD_MAX) return;
      setAdImages((prev) => [
        ...prev,
        { imageDataUrl, capturedAt: now },
      ]);
    },
    [skipLocation, locationImage, adImages.length]
  );

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;
    setIsCapturing(true);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    ctx.drawImage(video, 0, 0);
    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const imageDataUrl = await compressDataUrl(rawDataUrl);

    if (!isAdMode) {
      addCapturedImage(imageDataUrl);
      setIsCapturing(false);
      return;
    }

    try {
      const text = await runOcr(imageDataUrl);
      const match = matchOcrToAdvertiser(text, advertisers);
      if (match) {
        addCapturedImage(imageDataUrl);
        toast({ description: `${match.advertiserName} 광고주로 인식됨` });
      } else {
        setPendingNoMatchImage(imageDataUrl);
        setShowNoAdvertiserSheet(true);
      }
    } catch (e) {
      if (e instanceof OcrRateLimitError) {
        toast({
          title: "OCR 제한",
          description: e.message,
          variant: "destructive",
        });
        return;
      }
      setPendingNoMatchImage(imageDataUrl);
      setShowNoAdvertiserSheet(true);
    } finally {
      setIsCapturing(false);
    }
  }, [addCapturedImage, isAdMode, advertisers, toast]);

  const handleSkipLocation = useCallback(() => {
    setSkipLocation(true);
  }, []);

  const saveSessionAndGoToConfirm = useCallback(() => {
    if (!canFinish) return;
    const cached = gpsPositionRef.current;
    const isCachedFresh =
      cached && Date.now() - cached.timestamp < GPS_MAX_AGE_MS;
    const data: CaptureSessionData = {
      ...(locationImage
        ? {
          locationImage,
          locationCapturedAt: new Date().toISOString(),
        }
        : { skipLocation: true }),
      adImages: [...adImages],
      lat: isCachedFresh ? cached!.lat : undefined,
      lng: isCachedFresh ? cached!.lng : undefined,
      accuracy: isCachedFresh ? cached!.accuracy : undefined,
    };
    const totalImages = adImages.length + (locationImage ? 1 : 0);
    if (totalImages >= SESSION_STORAGE_WARN_IMAGE_COUNT) {
      toast({
        title: "저장 용량 참고",
        description: "사진이 많아 저장 용량이 클 수 있습니다. 확인 페이지에서 바로 ZIP 다운로드해 주세요.",
      });
    }
    try {
      sessionStorage.setItem(CAPTURE_SESSION_KEY, JSON.stringify(data));
    } catch (e) {
      const isQuota = e instanceof DOMException && e.name === "QuotaExceededError";
      if (isQuota) {
        toast({
          title: "저장 공간 초과",
          description: "촬영 데이터가 많아 일부만 저장됩니다. 사진 수를 줄이거나 확인 페이지에서 바로 다운로드해 주세요.",
          variant: "destructive",
        });
      }
    }
    router.push("/capture/confirm");
  }, [canFinish, locationImage, adImages, router, toast]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col bg-slate-50">
      <div className="container py-4">
        <h1 className="text-xl font-bold tracking-tight text-slate-900">광고 촬영</h1>
        <p className="mt-1 text-sm text-slate-500">
          먼저 지하철 역명판을 촬영한 뒤, 광고 배너를 다양한 각도로 촬영해 주세요 (최대 10장).
        </p>
        {status === "ready" && (locationImage != null || skipLocation) && (
          <p className="mt-2 text-sm font-semibold text-indigo-600">
            {skipLocation ? "위치 없음 · " : "위치 1장 · "}광고 {adImages.length}장
          </p>
        )}
        {advertisersLoading && (
          <p className="mt-1 text-xs text-slate-400">광고주 목록 불러오는 중…</p>
        )}
        {advertisersError && !advertisersLoading && (
          <p className="mt-1 text-xs text-amber-600">
            광고주 목록을 불러오지 못했습니다. 매칭이 제한될 수 있습니다.
          </p>
        )}
        {status === "ready" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
            {gpsStatus === "loading" && "위치 수집 중..."}
            {gpsStatus === "ready" && "위치 준비됨"}
            {gpsStatus === "error" && "위치 사용 불가 (권한 또는 오류)"}
            {gpsStatus === "unsupported" && "위치 미지원 브라우저"}
          </p>
        )}
      </div>

      <div className="relative flex-1 min-h-[240px] bg-slate-950 overflow-hidden shadow-inner">
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-400">
            카메라 연결 중...
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-slate-950 p-4 text-center text-slate-300">
            <AlertCircle className="h-10 w-10 text-red-500" />
            <p className="text-sm">{errorMessage}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={startCamera}
              className="border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:text-white"
            >
              다시 시도
            </Button>
          </div>
        )}
        {status === "ready" && (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="h-full w-full object-cover"
            />
            {/* AI Scanner Effect */}
            <div className="absolute inset-0 z-10 pointer-events-none opacity-60">
              <div className="w-full h-[50%] bg-gradient-to-b from-transparent via-cyan-500/20 to-cyan-500/50 absolute top-0 animate-scanner-line" />
            </div>
            {/* Grid overlay for tech feel */}
            <div className="absolute inset-0 z-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
          </>
        )}
        {status === "idle" && !errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950 text-slate-500">
            카메라를 불러오는 중...
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4 flex flex-col gap-3 w-full safe-area-padding-bottom shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-10">
        <div className="flex flex-col gap-3 w-full">
          {status === "ready" && (
            <>
              {locationImage == null && !skipLocation && (
                <>
                  <Button
                    size="lg"
                    className="gap-2 w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all"
                    disabled={isCapturing}
                    onClick={handleCapture}
                  >
                    <Camera className="h-6 w-6" />
                    {isCapturing ? "촬영 중..." : "위치(역명) 촬영"}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    className="gap-2 w-full h-12 text-slate-600 border-slate-200 hover:bg-slate-50 active:scale-[0.98] transition-all"
                    onClick={handleSkipLocation}
                  >
                    <MapPinOff className="h-5 w-5" />
                    위치 없음
                  </Button>
                </>
              )}
              {(locationImage != null || skipLocation) && (
                <>
                  {skipLocation && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 w-full text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                      onClick={() => setSkipLocation(false)}
                    >
                      <MapPin className="h-4 w-4" />
                      위치 촬영으로 되돌리기
                    </Button>
                  )}
                  <Button
                    size="lg"
                    className="gap-2 w-full h-14 text-lg font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50"
                    disabled={isCapturing || adImages.length >= AD_MAX}
                    onClick={handleCapture}
                  >
                    <Camera className="h-6 w-6" />
                    {isCapturing
                      ? (isAdMode ? "OCR 인식 중..." : "촬영 중...")
                      : `광고 촬영 (${adImages.length}/${AD_MAX})`}
                  </Button>
                  {canFinish && (
                    <Button
                      size="lg"
                      className="gap-2 w-full h-12 bg-slate-900 text-white hover:bg-slate-800 shadow-md active:scale-[0.98] transition-all"
                      onClick={saveSessionAndGoToConfirm}
                    >
                      <FileText className="h-5 w-5" />
                      이 위치 촬영 완료
                    </Button>
                  )}
                </>
              )}
            </>
          )}
          {status === "error" && (
            <Button
              variant="outline"
              size="lg"
              className="w-full h-12 border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
              onClick={startCamera}
            >
              카메라 다시 켜기
            </Button>
          )}
        </div>
        {canFinish ? (
          <Button
            size="lg"
            variant="outline"
            className="gap-2 w-full h-12 border-slate-200 text-slate-600 hover:bg-slate-50"
            onClick={saveSessionAndGoToConfirm}
          >
            <FileText className="h-5 w-5" />
            보고서 작성하기
          </Button>
        ) : (
          <Button asChild variant="outline" size="lg" className="gap-2 w-full h-12 border-slate-200 text-slate-600 hover:bg-slate-50">
            <Link href="/reports">
              <FileText className="h-5 w-5" />
              보고서 목록
            </Link>
          </Button>
        )}
      </div>

      <Sheet open={showNoAdvertiserSheet} onOpenChange={setShowNoAdvertiserSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>매칭되는 광고주가 없습니다</SheetTitle>
            <SheetDescription>
              촬영한 광고물에서 등록된 광고주를 찾지 못했습니다. 재촬영하거나 광고주를 등록한 뒤 다시 시도해 주세요. 광고주 없이 일단 저장할 수도 있습니다.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="flex-row flex-wrap gap-3 sm:gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={() => {
                setPendingNoMatchImage(null);
                setShowNoAdvertiserSheet(false);
              }}
            >
              재촬영 시도
            </Button>
            <Button asChild className="flex-1 min-w-[100px]">
              <Link href="/advertisers/new" onClick={() => { setPendingNoMatchImage(null); setShowNoAdvertiserSheet(false); }}>
                광고주 등록
              </Link>
            </Button>
            <Button
              className="flex-1 min-w-[100px]"
              onClick={() => {
                if (pendingNoMatchImage) {
                  addCapturedImage(pendingNoMatchImage);
                  setPendingNoMatchImage(null);
                  setShowNoAdvertiserSheet(false);
                }
              }}
            >
              일단 저장
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div >
  );
}
