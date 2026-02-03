"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, AlertCircle, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CAPTURE_SESSION_KEY } from "@/features/capture/constants";
import type { CaptureSessionData } from "@/features/capture/constants";

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
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [gpsStatus, setGpsStatus] = useState<GpsStatus>("idle");

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
    video.play().catch(() => {});
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

  const handleCapture = useCallback(() => {
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
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.85);

    const saveAndNavigate = (lat?: number, lng?: number, accuracy?: number) => {
      const data: CaptureSessionData = {
        imageDataUrl,
        lat,
        lng,
        accuracy,
        capturedAt: new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(CAPTURE_SESSION_KEY, JSON.stringify(data));
      } catch {
        /* ignore */
      }
      router.push("/capture/confirm");
      setIsCapturing(false);
    };

    const cached = gpsPositionRef.current;
    const isCachedFresh =
      cached && Date.now() - cached.timestamp < GPS_MAX_AGE_MS;

    if (isCachedFresh) {
      saveAndNavigate(cached.lat, cached.lng, cached.accuracy);
      return;
    }

    if (navigator.geolocation?.getCurrentPosition) {
      navigator.geolocation.getCurrentPosition(
        (pos) =>
          saveAndNavigate(
            pos.coords.latitude,
            pos.coords.longitude,
            pos.coords.accuracy
          ),
        () => saveAndNavigate(),
        {
          enableHighAccuracy: GPS_HIGH_ACCURACY,
          timeout: 8000,
          maximumAge: GPS_MAX_AGE_MS,
        }
      );
    } else {
      saveAndNavigate();
    }
  }, [router]);

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="container py-4">
        <h1 className="text-xl font-semibold text-gray-900">광고 촬영</h1>
        <p className="mt-1 text-sm text-secondary-500">
          PC에서는 웹캠, 스마트폰에서는 후면 카메라로 촬영할 수 있습니다.
        </p>
        {status === "ready" && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-secondary-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {gpsStatus === "loading" && "위치 수집 중..."}
            {gpsStatus === "ready" && "위치 준비됨"}
            {gpsStatus === "error" && "위치 사용 불가 (권한 또는 오류)"}
            {gpsStatus === "unsupported" && "위치 미지원 브라우저"}
          </p>
        )}
      </div>

      <div className="relative flex-1 min-h-[240px] bg-gray-900">
        {status === "loading" && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-white">
            카메라 연결 중...
          </div>
        )}
        {status === "error" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gray-900 p-4 text-center text-white">
            <AlertCircle className="h-10 w-10 text-destructive" />
            <p className="text-sm">{errorMessage}</p>
            <Button variant="outline" size="sm" onClick={startCamera}>
              다시 시도
            </Button>
          </div>
        )}
        {status === "ready" && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="h-full w-full object-cover"
          />
        )}
        {status === "idle" && !errorMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900 text-secondary-400">
            카메라를 불러오는 중...
          </div>
        )}
      </div>

      <div className="border-t border-secondary-200 bg-white p-6 flex flex-wrap gap-3">
        {status === "ready" && (
          <Button
            size="lg"
            className="gap-2"
            disabled={isCapturing}
            onClick={handleCapture}
          >
            <Camera className="h-5 w-5" />
            {isCapturing ? "촬영 중..." : "촬영"}
          </Button>
        )}
        {status === "error" && (
          <Button variant="outline" size="lg" onClick={startCamera}>
            카메라 다시 켜기
          </Button>
        )}
      </div>
    </div>
  );
}
