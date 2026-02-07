"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  MapPinOff,
  Zap,
  ZapOff,
  SwitchCamera,
  Layers,
  FileText
} from "lucide-react";
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
import { CameraModeSwitcher } from "@/components/ui/camera-mode-switcher";
import { ShutterButton } from "@/components/ui/shutter-button";
import { cn } from "@/lib/utils";
// import { AnimatePresence, motion } from "framer-motion"; // Removed as requested to avoid issues if setup is missing

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
type CameraMode = "location" | "ad";

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
    // isLoading: advertisersLoading, 
  } = useAdvertisers();
  /** 광고주 매칭은 Supabase(API) 목록만 사용 */
  const advertisers = (advertisersList ?? []) as Parameters<typeof matchOcrToAdvertiser>[1];
  const { toast } = useToast();

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");

  // Camera Mode State
  const [mode, setMode] = useState<CameraMode>("location");

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

  // Flash & Camera Flip (Mock states for UI)
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const AD_MAX = 10;
  // If location is skipped, we are effectively always in ad mode logic-wise, 
  // but UI might still show "ad" mode.
  // const isAdMode = locationImage != null || skipLocation; 
  const canFinish = (locationImage != null || skipLocation) && adImages.length >= 1;

  // Last captured image for thumbnail
  const lastCapturedImage = adImages.length > 0
    ? adImages[adImages.length - 1].imageDataUrl
    : (locationImage ?? null);

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
          video: { facingMode: { ideal: facingMode } },
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
  }, [facingMode]);

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

  // Sync internal Mode state with logical state
  useEffect(() => {
    if (skipLocation) {
      setMode("ad");
    } else if (locationImage) {
      setMode("ad");
    } else {
      setMode("location");
    }
  }, [locationImage, skipLocation]);

  // Handler for user switching modes manually
  const handleModeSwitch = (newMode: CameraMode) => {
    if (newMode === "location") {
      if (skipLocation) {
        setSkipLocation(false);
      }
      // If we have a location image, user might want to retake it.
      // We act as if we are just viewing. Actual retake logic is in capture.
    }
    setMode(newMode);
  };

  const addCapturedImage = useCallback(
    (imageDataUrl: string) => {
      const now = new Date().toISOString();
      // Logic: If in Location Mode (and not skipped), save as location image.
      // If in Ad Mode, save as ad image.

      if (mode === "location") {
        setLocationImage(imageDataUrl);
        setSkipLocation(false);
        setMode("ad"); // Auto-switch to Ad mode after location capture
        toast({ description: "위치(역명) 사진이 촬영되었습니다. 이제 광고를 촬영하세요." });
        return;
      }

      if (adImages.length >= AD_MAX) {
        toast({ title: "촬영 한도 초과", description: "최대 10장까지만 촬영할 수 있습니다.", variant: "destructive" });
        return;
      }

      setAdImages((prev) => [
        ...prev,
        { imageDataUrl, capturedAt: now },
      ]);
      // Toast feedback
      // toast({ description: `광고 ${adImages.length + 1}장 저장됨` }); // Removed to avoid clutter, using visual cue instead
    },
    [mode, adImages.length, toast]
  );

  const handleCapture = useCallback(async () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    setIsCapturing(true); // Trigger shutter animation/processing state

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsCapturing(false);
      return;
    }
    // Flip if using user facing camera
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const imageDataUrl = await compressDataUrl(rawDataUrl);

    // If Location Mode, just save.
    if (mode === "location") {
      addCapturedImage(imageDataUrl);
      setIsCapturing(false);
      return;
    }

    // Ad Mode: Run OCR
    try {
      const text = await runOcr(imageDataUrl);
      const match = matchOcrToAdvertiser(text, advertisers);
      if (match) {
        addCapturedImage(imageDataUrl);
        toast({ description: `${match.advertiserName} 광고주 인식됨!` });
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
  }, [addCapturedImage, mode, advertisers, toast, facingMode]);

  const toggleSkipLocation = useCallback(() => {
    if (skipLocation) {
      setSkipLocation(false);
      setMode("location");
      toast({ description: "위치 촬영 모드로 전환합니다." });
    } else {
      setSkipLocation(true);
      setMode("ad");
      toast({ description: "위치 없이 광고 촬영을 시작합니다." });
    }
  }, [skipLocation, toast]);

  const saveSessionAndGoToConfirm = useCallback(() => {
    // Basic validation
    if (!canFinish) {
      toast({ description: "최소 1장의 광고 사진을 촬영해주세요.", variant: "destructive" });
      return;
    }

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
      router.push("/capture/confirm");
    } catch (e) {
      const isQuota = e instanceof DOMException && e.name === "QuotaExceededError";
      if (isQuota) {
        toast({
          title: "저장 공간 초과",
          description: "촬영 데이터가 많아 일부만 저장됩니다. 사진 수를 줄이거나 확인 페이지에서 바로 다운로드해 주세요.",
          variant: "destructive",
        });
        // Try to proceed anyway
        router.push("/capture/confirm");
      }
    }
  }, [canFinish, locationImage, adImages, router, toast]);

  // Helper to toggle flash (Mock)
  const toggleFlash = () => {
    setFlashOn(!flashOn);
    // Note: Actual constraints API for flash is quirky in browsers.
    // Ideally we would apply constraints here.
    toast({ description: flashOn ? "플래시 끄기 (지원 시)" : "플래시 켜기 (지원 시)" });
  };

  // Flip Camera
  const toggleFacingMode = () => {
    setFacingMode(prev => prev === "user" ? "environment" : "user");
  };

  return (
    <div className="fixed inset-0 bg-black text-white flex flex-col z-50 overflow-hidden">
      {/* 1. Viewfinder Layer (Full Screen) */}
      <div className="absolute inset-0 z-0 bg-gray-900">
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center text-white/50 z-20">
            카메라 연결 중...
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white/80 z-20">
            <p>{errorMessage}</p>
            <Button variant="outline" className="mt-4" onClick={startCamera}>다시 시도</Button>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            facingMode === "user" && "scale-x-[-1]", // Mirror selfie
            status === "ready" ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* AI Scanner Bar (Cyan) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-[50vh] bg-gradient-to-b from-transparent via-cyan-500/10 to-cyan-500/30 absolute top-[-50%] animate-scanner-line" />
          <div className="absolute inset-0 border-[0.5px] border-white/5" /> {/* Subtle screen border */}
        </div>
      </div>

      {/* 2. Top Bar (Safe Area) */}
      <div className="relative z-10 w-full bg-gradient-to-b from-black/80 to-transparent pt-safe-top px-4 pb-12">
        <div className="flex items-center justify-between h-14">
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => router.back()}>
            <ChevronLeft className="w-8 h-8" />
          </Button>

          <div className="flex flex-col items-center">
            <h1 className="text-base font-semibold drop-shadow-md">광고 촬영</h1>
            {/* Optional Status Indicators */}
            {/* <span className="text-[10px] text-white/70 bg-black/30 px-2 py-0.5 rounded-full">GPS Ready</span> */}
          </div>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={toggleFlash}>
            {flashOn ? <Zap className="w-6 h-6 text-yellow-400 fill-current" /> : <ZapOff className="w-6 h-6 opacity-70" />}
          </Button>
        </div>

        {/* Location Off Toggle (Top Right/Left contextual) */}
        <div className="absolute top-16 right-4">
          <Button
            variant={skipLocation ? "secondary" : "ghost"}
            size="sm"
            className={cn("h-8 text-xs backdrop-blur-md gap-1.5 rounded-full transition-all", skipLocation ? "bg-white text-black" : "bg-black/40 text-white/90 border border-white/10")}
            onClick={toggleSkipLocation}
          >
            <MapPinOff className="w-3.5 h-3.5" />
            {skipLocation ? "위치 없음 켜짐" : "위치 없음"}
          </Button>
        </div>
      </div>

      {/* Spacer to push controls to bottom */}
      <div className="flex-1" />

      {/* 3. Bottom Controls (Opaque Black) */}
      <div className="relative z-10 w-full bg-black/95 rounded-t-[2.5rem] pb-safe-bottom pt-6 px-6 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] border-t border-white/5">

        {/* Mode Switcher */}
        <div className="flex justify-center mb-6">
          <CameraModeSwitcher
            currentMode={mode}
            onChangeMode={handleModeSwitch}
          />
        </div>

        {/* Shutter & Gallery Row */}
        <div className="flex items-center justify-between px-2 pb-6">

          {/* Left: Gallery / Done */}
          <div className="w-20 flex flex-col items-center gap-1.5">
            <div className="relative group cursor-pointer" onClick={saveSessionAndGoToConfirm}>
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-800">
                {lastCapturedImage ? (
                  <img src={lastCapturedImage} alt="Last" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Layers className="w-6 h-6" />
                  </div>
                )}
              </div>
              {(adImages.length > 0) && (
                <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-black px-1">
                  {adImages.length}
                </div>
              )}
            </div>
            <span className="text-[11px] font-medium text-white/60">완료</span>
          </div>

          {/* Center: Shutter */}
          <div className="flex-1 flex justify-center">
            <ShutterButton
              onClick={handleCapture}
              isProcessing={isCapturing}
              disabled={status !== "ready"}
              className={cn(mode === "location" ? "ring-2 ring-offset-2 ring-offset-black ring-yellow-400" : "")}
            />
          </div>

          {/* Right: Camera Flip (or spacer) */}
          <div className="w-20 flex flex-col items-center justify-center">
            <Button variant="ghost" size="icon" className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 text-white/80" onClick={toggleFacingMode}>
              <SwitchCamera className="w-6 h-6" />
            </Button>
          </div>
        </div>
      </div>

      {/* -- Sheets/Modals -- */}
      <Sheet open={showNoAdvertiserSheet} onOpenChange={setShowNoAdvertiserSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-safe-bottom">
          <SheetHeader className="text-left">
            <SheetTitle>광고주 미인식</SheetTitle>
            <SheetDescription>
              광고주를 찾지 못했습니다. 어떻게 할까요?
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="flex-row flex-wrap gap-3 mt-6 sm:justify-start">
            <Button
              variant="outline"
              className="flex-1 h-12"
              onClick={() => {
                setPendingNoMatchImage(null);
                setShowNoAdvertiserSheet(false);
              }}
            >
              재촬영
            </Button>
            <Button asChild className="flex-1 h-12" variant="secondary">
              <Link href="/advertisers/new" onClick={() => { setPendingNoMatchImage(null); setShowNoAdvertiserSheet(false); }}>
                광고주 등록
              </Link>
            </Button>
            <Button
              className="flex-1 h-12 bg-indigo-600 hover:bg-indigo-700"
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
    </div>
  );
}
