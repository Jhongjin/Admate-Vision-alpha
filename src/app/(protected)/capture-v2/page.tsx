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
  FileText,
  Train,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  SESSION_STORAGE_WARN_IMAGE_COUNT,
  type AdCaptureItem,
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
import { useCaptureStore } from "@/features/capture/store/use-capture-store";

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
const GPS_HIGH_ACCURACY = false;

type GpsStatus = "idle" | "loading" | "ready" | "error" | "unsupported";
type CameraMode = "location" | "ad";

export default function CaptureV2Page() {
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
  } = useAdvertisers();
  const advertisers = (advertisersList ?? []) as Parameters<typeof matchOcrToAdvertiser>[1];
  const { toast } = useToast();

  // ── Zustand Store ──
  const {
    currentVisit,
    completedVisits,
    setLocationImage: storeSetLocationImage,
    addAdImage: storeAddAdImage,
    setRecognizedAdvertiser: storeSetRecognizedAdvertiser,
    setGps: storeSetGps,
    pushCurrentAndStartNew,
    getAllVisits,
    getTotalStationCount,
  } = useCaptureStore();

  // Derived from store
  const locationImage = currentVisit.locationImage ?? null;
  const adImages = currentVisit.adImages;
  const recognizedAdvertiser = currentVisit.recognizedAdvertiser;
  const stackedStationCount = completedVisits.length;

  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");
  const [mode, setMode] = useState<CameraMode>("location");
  const [skipLocation, setSkipLocation] = useState(false);
  const [showNoAdvertiserSheet, setShowNoAdvertiserSheet] = useState(false);
  const [pendingNoMatchImage, setPendingNoMatchImage] = useState<string | null>(null);
  const [flashOn, setFlashOn] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  const AD_MAX = 10;
  const canFinish = (locationImage != null || skipLocation) && adImages.length >= 1;

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

        // Also save to store
        storeSetGps(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
      },
      () => setGpsStatus("error"),
      {
        enableHighAccuracy: GPS_HIGH_ACCURACY,
        timeout: 12000,
        maximumAge: GPS_MAX_AGE_MS,
      }
    );
  }, [status, storeSetGps]);

  useEffect(() => {
    if (skipLocation) {
      setMode("ad");
    } else if (locationImage) {
      setMode("ad");
    } else {
      setMode("location");
    }
  }, [locationImage, skipLocation]);

  const handleModeSwitch = (newMode: CameraMode) => {
    if (newMode === "location") {
      if (skipLocation) {
        setSkipLocation(false);
      }
    }
    setMode(newMode);
  };

  const addCapturedImage = useCallback(
    (imageDataUrl: string) => {
      const now = new Date().toISOString();

      if (mode === "location") {
        storeSetLocationImage(imageDataUrl);
        setSkipLocation(false);
        setMode("ad");
        toast({ description: "위치(역명) 사진이 촬영되었습니다. 이제 광고를 촬영하세요." });
        return;
      }

      if (adImages.length >= AD_MAX) {
        toast({ title: "촬영 한도 초과", description: "최대 10장까지만 촬영할 수 있습니다.", variant: "destructive" });
        return;
      }

      storeAddAdImage({ imageDataUrl, capturedAt: now });
    },
    [mode, adImages.length, toast, storeSetLocationImage, storeAddAdImage]
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
    if (facingMode === "user") {
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
    }
    ctx.drawImage(video, 0, 0);
    const rawDataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const imageDataUrl = await compressDataUrl(rawDataUrl);

    if (mode === "location") {
      addCapturedImage(imageDataUrl);
      setIsCapturing(false);
      return;
    }

    try {
      const text = await runOcr(imageDataUrl);
      const match = matchOcrToAdvertiser(text, advertisers);
      if (match) {
        storeSetRecognizedAdvertiser(match.advertiserId, match.advertiserName);
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
  }, [addCapturedImage, mode, advertisers, toast, facingMode, storeSetRecognizedAdvertiser]);

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

  // ── 다음 역 촬영 ──
  const handleNextStation = useCallback(() => {
    if (adImages.length < 1) {
      toast({ description: "최소 1장의 광고 사진을 촬영해야 다음 역으로 이동할 수 있습니다.", variant: "destructive" });
      return;
    }
    const total = getTotalStationCount();
    if (total >= 10) {
      toast({ title: "최대 역 수 초과", description: "최대 10개 역까지만 촬영할 수 있습니다.", variant: "destructive" });
      return;
    }
    // Save GPS to current visit before pushing
    const cached = gpsPositionRef.current;
    const isCachedFresh = cached && Date.now() - cached.timestamp < GPS_MAX_AGE_MS;
    if (isCachedFresh && cached) {
      storeSetGps(cached.lat, cached.lng, cached.accuracy);
    }
    pushCurrentAndStartNew();
    setSkipLocation(false);
    setMode("location");
    toast({
      title: `📍 ${stackedStationCount + 1}개 역 완료`,
      description: "새로운 역 촬영을 시작하세요.",
    });
  }, [adImages.length, pushCurrentAndStartNew, getTotalStationCount, toast, storeSetGps, stackedStationCount]);

  // ── 완료 → confirm 페이지 ──
  const saveAndGoToConfirm = useCallback(() => {
    if (!canFinish && completedVisits.length === 0) {
      toast({ description: "최소 1장의 광고 사진을 촬영해주세요.", variant: "destructive" });
      return;
    }

    // Save GPS to current visit
    const cached = gpsPositionRef.current;
    const isCachedFresh = cached && Date.now() - cached.timestamp < GPS_MAX_AGE_MS;
    if (isCachedFresh && cached) {
      storeSetGps(cached.lat, cached.lng, cached.accuracy);
    }

    const allVisits = getAllVisits();
    const totalImages = allVisits.reduce((sum, v) => sum + v.adImages.length + (v.locationImage ? 1 : 0), 0);

    if (totalImages >= SESSION_STORAGE_WARN_IMAGE_COUNT) {
      toast({
        title: "저장 용량 참고",
        description: "사진이 많아 저장 용량이 클 수 있습니다.",
      });
    }

    // Navigate to v2 confirm page
    router.push("/capture-v2/confirm");
  }, [canFinish, completedVisits.length, getAllVisits, router, toast, storeSetGps]);

  const toggleFlash = () => {
    setFlashOn(!flashOn);
    toast({ description: flashOn ? "플래시 끄기 (지원 시)" : "플래시 켜기 (지원 시)" });
  };

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
            <Button className="mt-4 bg-white text-black hover:bg-neutral-200" onClick={startCamera}>다시 시도</Button>
          </div>
        )}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            "w-full h-full object-cover transition-opacity duration-300",
            facingMode === "user" && "scale-x-[-1]",
            status === "ready" ? "opacity-100" : "opacity-0"
          )}
        />

        {/* Tech Grid Overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:40px_40px]" />

        {/* AI Scanner Bar (Cyan) */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="w-full h-[50vh] bg-gradient-to-b from-transparent via-cyan-500/10 to-cyan-500/30 absolute top-[-50%] animate-scanner-line" />
          <div className="absolute inset-0 border-[0.5px] border-white/5" />
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
          </div>

          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={toggleFlash}>
            {flashOn ? <Zap className="w-6 h-6 text-yellow-400 fill-current" /> : <ZapOff className="w-6 h-6 opacity-70" />}
          </Button>
        </div>

        {/* Stack indicator + Location Off Toggle */}
        <div className="absolute top-16 right-4 flex flex-col items-end gap-2">
          {/* Stack indicator */}
          {stackedStationCount > 0 && (
            <div className="flex items-center gap-1.5 bg-indigo-500/90 text-white text-xs font-bold px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg">
              <Train className="w-3.5 h-3.5" />
              📍 {stackedStationCount}개 역 완료
            </div>
          )}

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
        <div className="flex justify-center mb-4">
          <CameraModeSwitcher
            currentMode={mode}
            onChangeMode={handleModeSwitch}
          />
        </div>

        {/* "다음 역 촬영" Button */}
        {canFinish && (
          <div className="flex justify-center mb-4">
            <Button
              variant="outline"
              size="sm"
              className="h-9 text-sm bg-white/10 text-white border-white/20 hover:bg-white/20 gap-2 rounded-full px-5"
              onClick={handleNextStation}
            >
              <Train className="w-4 h-4" />
              다음 역 촬영
            </Button>
          </div>
        )}

        {/* Shutter & Gallery Row */}
        <div className="flex items-center justify-between px-2 pb-6">

          {/* Left: Gallery / Done */}
          <div className="w-20 flex flex-col items-center gap-1.5">
            <div className="relative group cursor-pointer" onClick={saveAndGoToConfirm}>
              <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-white/20 bg-gray-800">
                {lastCapturedImage ? (
                  <img src={lastCapturedImage} alt="Last" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white/20">
                    <Layers className="w-6 h-6" />
                  </div>
                )}
              </div>
              {(adImages.length > 0 || completedVisits.length > 0) && (
                <div className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 bg-indigo-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-black px-1">
                  {adImages.length + completedVisits.reduce((s, v) => s + v.adImages.length, 0)}
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

          {/* Right: Camera Flip */}
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
