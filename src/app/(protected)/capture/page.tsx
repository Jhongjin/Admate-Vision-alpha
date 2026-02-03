"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function CapturePage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const startCamera = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setErrorMessage("이 브라우저는 카메라를 지원하지 않습니다.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMessage(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setStatus("ready");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "카메라 접근에 실패했습니다.";
      setErrorMessage(
        message.includes("Permission")
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

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="container py-4">
        <h1 className="text-xl font-semibold text-gray-900">광고 촬영</h1>
        <p className="mt-1 text-sm text-secondary-500">
          PC에서는 웹캠, 스마트폰에서는 후면 카메라로 촬영할 수 있습니다.
        </p>
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
          <Button asChild size="lg" className="gap-2">
            <Link href="/capture/confirm">
              <Camera className="h-5 w-5" />
              촬영
            </Link>
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
