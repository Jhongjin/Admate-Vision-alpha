"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import {
  MapPin,
  Building2,
  Send,
  FileImage,
  Download,
  Replace,
  RotateCcw,
  RotateCw,
  MapPinOff,
  Trash2,
  ChevronLeft,
  AlertCircle,
  CheckCircle2,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  CAPTURE_SESSION_KEY,
  isLocationAdSession,
  type CaptureSessionData,
} from "@/features/capture/constants";
import { buildCaptureFilename, sanitizeFilenamePart } from "@/features/capture/lib/capture-filename";
import { useAdvertisers } from "@/features/advertisers/hooks/useAdvertisers";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { dataUrlToBlob } from "@/features/capture/lib/dataurl-to-blob";
import { rotateDataUrl, type RotateDirection } from "@/features/capture/lib/rotate-dataurl";
import { extractTextFromImage } from "@/features/capture/lib/ocr";
import { matchOcrToAdvertiser, type AdvertiserForMatch } from "@/features/capture/lib/match-advertiser";
import { reverseGeocode } from "@/features/capture/lib/reverse-geocode";
import { parseStationFromOcr } from "@/features/capture/lib/station-from-ocr";
import { getSubwayLineFromImage } from "@/features/capture/lib/subway-line-color";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const FALLBACK = {
  location: "위치 정보 없음",
  advertiser: "광고주 미인식",
  station: "미인식",
  line: "미인식",
};

function buildNoLocationFilename(
  advertiser: string,
  userEnteredName: string,
  dateStr: string,
  index: number
): string {
  const adv = sanitizeFilenamePart(advertiser);
  const user = userEnteredName.trim() ? sanitizeFilenamePart(userEnteredName) : "";
  const date = /^\d{8}$/.test(dateStr) ? dateStr : dateStr.replace(/\D/g, "").slice(0, 8) || "00000000";
  const seq = String(Math.max(1, Math.min(99, Math.floor(index)))).padStart(2, "0");
  const parts = [adv];
  if (user) parts.push(user);
  parts.push(date, seq);
  return `${parts.join("_")}.jpg`;
}

function runOcr(
  imageDataUrl: string
): Promise<{ text: string; textForStation?: string }> {
  return fetch("/api/capture/ocr", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageDataUrl }),
  })
    .then((res) => {
      if (res.ok)
        return res.json() as Promise<{ text: string; textForStation?: string }>;
      return Promise.reject(new Error("Server OCR unavailable"));
    })
    .catch(() =>
      extractTextFromImage(imageDataUrl).then((ocr) => ({ text: ocr.text }))
    );
}

export default function CaptureConfirmPage() {
  const [data, setData] = useState<CaptureSessionData | null>(null);
  const [addressLabel, setAddressLabel] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [advertiserLabel, setAdvertiserLabel] = useState<string | null>(null);
  const [advertiserLoading, setAdvertiserLoading] = useState(false);

  // Location/Ad Session Meta
  const [stationName, setStationName] = useState<string | null>(null);
  const [subwayLine, setSubwayLine] = useState<string | null>(null);

  // File Management
  const [generatedFilenames, setGeneratedFilenames] = useState<string[]>([]);
  const [editedFilenames, setEditedFilenames] = useState<string[]>([]);
  const [userEnteredName, setUserEnteredName] = useState("");
  const [metaForFilename, setMetaForFilename] = useState<{
    advertiser: string;
    line: string;
    station: string;
    dateStr: string;
  } | null>(null);

  // Report Settings
  const [matchedAdvertiserId, setMatchedAdvertiserId] = useState<string | null>(null);
  const [primaryRecipient, setPrimaryRecipient] = useState<"advertiser" | "campaign">("campaign");
  const [senderNameOption, setSenderNameOption] = useState<"user" | "campaign">("user");
  const [displayDays, setDisplayDays] = useState(7);

  // UI States
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  const [selectedImageIndices, setSelectedImageIndices] = useState<Set<number>>(new Set());
  const [imageRotating, setImageRotating] = useState(false);
  const [bulkFind, setBulkFind] = useState("");
  const [bulkReplace, setBulkReplace] = useState("");
  const [metaLoading, setMetaLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [reportSending, setReportSending] = useState(false);

  // Sheets
  const [showNoStationSheet, setShowNoStationSheet] = useState(false);
  const [hasShownNoStationSheet, setHasShownNoStationSheet] = useState(false);
  const [showAiTimeoutSheet, setShowAiTimeoutSheet] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { data: advertisersData } = useAdvertisers();
  const advertisers = advertisersData ?? [];
  const { profile } = useUserProfile();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  // --- Logic Implementation (Same as original) ---

  useEffect(() => {
    if (sessionId) {
      setMetaLoading(true);
      fetch(`/api/reports/${sessionId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed");
          return res.json();
        })
        .then(async (report) => {
          const imageUrls: string[] = report.image_urls || [];
          const adImages = imageUrls.map((url) => ({
            imageDataUrl: url,
            capturedAt: report.created_at
          }));

          const sessionData: CaptureSessionData = {
            adImages: adImages,
            locationImage: undefined,
            capturedAt: report.sent_at,
            locationCapturedAt: report.sent_at,
            lat: null,
            lng: null,
            skipLocation: !report.station,
          };
          setData(sessionData);
          setMatchedAdvertiserId(report.advertiser_id);
          setStationName(report.station);
          setSubwayLine(report.line);
          setAdvertiserLabel(report.advertiser_name);
          setUserEnteredName(report.location_label || "");

          const dateStr = report.sent_at ? format(new Date(report.sent_at), "yyyyMMdd") : format(new Date(), "yyyyMMdd");
          setMetaForFilename({
            advertiser: report.advertiser_name,
            line: report.line || "미인식",
            station: report.station || "미인식",
            dateStr
          });
          const names = adImages.map((_, i) =>
            !report.station
              ? buildNoLocationFilename(report.advertiser_name, report.location_label || "", dateStr, i + 1)
              : buildCaptureFilename(report.advertiser_name, report.line, report.station, report.location_label || "", dateStr, i + 1)
          );
          setGeneratedFilenames(names);
          setEditedFilenames(names);
        })
        .catch((e) => toast({ title: "불러오기 실패", description: "리포트를 찾을 수 없습니다.", variant: "destructive" }))
        .finally(() => setMetaLoading(false));
    } else {
      try {
        const raw = sessionStorage.getItem(CAPTURE_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CaptureSessionData;
          if (parsed.imageDataUrl || isLocationAdSession(parsed)) setData(parsed);
        }
      } catch { }
    }
  }, [sessionId, toast]);

  useEffect(() => {
    if (!data) return;
    if (data.lat == null || data.lng == null) return;
    setAddressLoading(true);
    setAddressLabel(null);
    reverseGeocode(data.lat, data.lng)
      .then((addr) => setAddressLabel(addr ?? null))
      .catch(() => setAddressLabel(null))
      .finally(() => setAddressLoading(false));
  }, [data?.lat, data?.lng]);

  useEffect(() => {
    if (!data?.imageDataUrl || isLocationAdSession(data)) return;
    setAdvertiserLoading(true);
    setAdvertiserLabel(null);
    const imageDataUrl = data.imageDataUrl;
    runOcr(imageDataUrl)
      .then((ocrBody) => {
        const text = ocrBody.text;
        const match = matchOcrToAdvertiser(text, advertisers);
        setAdvertiserLabel(match ? match.advertiserName : null);
        setMatchedAdvertiserId(match ? match.advertiserId : null);
      })
      .catch(() => {
        setAdvertiserLabel(null);
        setMatchedAdvertiserId(null);
      })
      .finally(() => setAdvertiserLoading(false));
  }, [data?.imageDataUrl, data?.locationImage, advertisers]);

  const resolveMultiSessionMeta = useCallback(async (
    session: CaptureSessionData & { adImages: { imageDataUrl: string; capturedAt: string }[] },
    advertiserList: AdvertiserForMatch[]
  ) => {
    setMetaLoading(true);
    setStationName(null);
    setSubwayLine(null);
    setAdvertiserLabel(null);
    setMatchedAdvertiserId(null);
    setGeneratedFilenames([]);
    setMetaForFilename(null);

    const ads = session.adImages;
    const dateFromFirst = session.locationCapturedAt ?? ads[0]?.capturedAt;
    const dateStr = dateFromFirst
      ? format(new Date(dateFromFirst), "yyyyMMdd")
      : format(new Date(), "yyyyMMdd");

    let resolvedStation = FALLBACK.station;
    let resolvedLine = FALLBACK.line;

    if (session.locationImage) {
      try {
        const [locOcrResult, lineFromColor] = await Promise.all([
          runOcr(session.locationImage),
          getSubwayLineFromImage(session.locationImage),
        ]);
        const locOcrText = locOcrResult.textForStation ?? locOcrResult.text;
        const station = parseStationFromOcr(locOcrText);
        resolvedStation = station.stationName ?? FALLBACK.station;
        resolvedLine = station.line ?? lineFromColor ?? FALLBACK.line;
        setStationName(resolvedStation);
        setSubwayLine(resolvedLine);
      } catch {
        setStationName(FALLBACK.station);
        setSubwayLine(FALLBACK.line);
      }
    } else {
      setStationName(FALLBACK.station);
      setSubwayLine(FALLBACK.line);
    }

    try {
      // 1. Check if we already have a recognized advertiser from the capture session
      if (session.recognizedAdvertiser) {
        setAdvertiserLabel(session.recognizedAdvertiser.name);
        setMatchedAdvertiserId(session.recognizedAdvertiser.id);
        setMetaForFilename({
          advertiser: session.recognizedAdvertiser.name,
          line: resolvedLine,
          station: resolvedStation,
          dateStr,
        });
        const names = ads.map((_, i) =>
          session.skipLocation
            ? buildNoLocationFilename(session.recognizedAdvertiser!.name, "", dateStr, i + 1)
            : buildCaptureFilename(
              session.recognizedAdvertiser!.name,
              resolvedLine,
              resolvedStation,
              "",
              dateStr,
              i + 1
            )
        );
        setGeneratedFilenames(names);
      } else {
        // 2. Fallback: Run OCR on the first image if not recognized
        const firstAdUrl = ads[0]?.imageDataUrl;
        if (firstAdUrl) {
          runOcr(firstAdUrl)
            .then((ocrBody) => {
              const adOcrText = ocrBody.text;
              const match = matchOcrToAdvertiser(adOcrText, advertiserList);
              const advertiser = match ? match.advertiserName : FALLBACK.advertiser;
              setAdvertiserLabel(match ? match.advertiserName : null);
              setMatchedAdvertiserId(match ? match.advertiserId : null);
              setMetaForFilename({
                advertiser,
                line: resolvedLine,
                station: resolvedStation,
                dateStr,
              });
              const names = ads.map((_, i) =>
                session.skipLocation
                  ? buildNoLocationFilename(advertiser, "", dateStr, i + 1)
                  : buildCaptureFilename(
                    advertiser,
                    resolvedLine,
                    resolvedStation,
                    "",
                    dateStr,
                    i + 1
                  )
              );
              setGeneratedFilenames(names);
            })
            .catch(() => {
              const adv = FALLBACK.advertiser;
              setMatchedAdvertiserId(null);
              setMetaForFilename({
                advertiser: adv,
                line: resolvedLine,
                station: resolvedStation,
                dateStr,
              });
              setGeneratedFilenames(
                ads.map((_, i) =>
                  session.skipLocation
                    ? buildNoLocationFilename(adv, "", dateStr, i + 1)
                    : buildCaptureFilename(adv, resolvedLine, resolvedStation, "", dateStr, i + 1)
                )
              );
            });
        } else {
          setGeneratedFilenames([]);
        }
      }
    } catch {
      setStationName(FALLBACK.station);
      setSubwayLine(FALLBACK.line);
      setAdvertiserLabel(null);
      setMatchedAdvertiserId(null);
      setMetaForFilename({
        advertiser: FALLBACK.advertiser,
        line: FALLBACK.line,
        station: FALLBACK.station,
        dateStr,
      });
      setGeneratedFilenames(ads.map((_, i) => session.skipLocation ? buildNoLocationFilename(FALLBACK.advertiser, "", dateStr, i + 1) : buildCaptureFilename(FALLBACK.advertiser, FALLBACK.line, FALLBACK.station, "", dateStr, i + 1)));
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data || !isLocationAdSession(data)) return;
    resolveMultiSessionMeta(data, advertisers);
  }, [data, advertisers, resolveMultiSessionMeta]);

  useEffect(() => {
    if (generatedFilenames.length > 0) {
      setEditedFilenames([...generatedFilenames]);
      setSelectedIndices(new Set(generatedFilenames.map((_, i) => i)));
    }
  }, [generatedFilenames]);

  useEffect(() => {
    if (!data || !isLocationAdSession(data) || !metaForFilename || !data.adImages.length) return;
    setEditedFilenames(
      data.adImages.map((_, i) =>
        data.skipLocation
          ? buildNoLocationFilename(metaForFilename.advertiser, userEnteredName, metaForFilename.dateStr, i + 1)
          : buildCaptureFilename(metaForFilename.advertiser, metaForFilename.line, metaForFilename.station, userEnteredName, metaForFilename.dateStr, i + 1)
      )
    );
  }, [userEnteredName, metaForFilename, data]);

  useEffect(() => {
    if (
      !metaLoading &&
      data?.locationImage &&
      (stationName === FALLBACK.station || stationName === "미인식") &&
      !hasShownNoStationSheet
    ) {
      setShowNoStationSheet(true);
      setHasShownNoStationSheet(true);
    }
  }, [metaLoading, data?.locationImage, stationName, hasShownNoStationSheet]);


  // --- Helper Functions ---

  const toggleSelectIndex = useCallback((index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIndices(new Set(editedFilenames.map((_, i) => i)));
  }, [editedFilenames.length]);

  const selectAllImages = useCallback(() => {
    if (!data?.adImages?.length) return;
    setSelectedImageIndices(new Set(data.adImages.map((_, i) => i)));
  }, [data?.adImages?.length]);

  const toggleImageSelection = useCallback((index: number) => {
    setSelectedImageIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);

  const applyRotatedImage = useCallback((index: number, newDataUrl: string) => {
    if (!data?.adImages) return;
    const next = data.adImages.map((ad, i) =>
      i === index ? { ...ad, imageDataUrl: newDataUrl } : ad
    );
    const nextData: CaptureSessionData = { ...data, adImages: next };
    setData(nextData);
    try {
      sessionStorage.setItem(CAPTURE_SESSION_KEY, JSON.stringify(nextData));
    } catch { }
  }, [data]);

  const rotateImageAt = useCallback(
    async (index: number, direction: RotateDirection) => {
      if (!data?.adImages?.[index] || imageRotating) return;
      setImageRotating(true);
      try {
        const rotated = await rotateDataUrl(data.adImages[index].imageDataUrl, direction);
        applyRotatedImage(index, rotated);
        toast({ description: direction === "right" ? "오른쪽 90° 회전 적용" : "왼쪽 90° 회전 적용" });
      } catch {
        toast({ title: "회전 실패", variant: "destructive" });
      } finally {
        setImageRotating(false);
      }
    },
    [data?.adImages, imageRotating, applyRotatedImage, toast]
  );

  const rotateSelected = useCallback(
    async (direction: RotateDirection) => {
      if (selectedImageIndices.size === 0) {
        toast({ description: "회전할 사진을 선택해 주세요.", variant: "destructive" });
        return;
      }
      if (!data?.adImages) return;
      setImageRotating(true);
      try {
        const indices = Array.from(selectedImageIndices).sort((a, b) => a - b);
        let nextImages = [...data.adImages];
        for (const i of indices) {
          const rotated = await rotateDataUrl(nextImages[i].imageDataUrl, direction);
          nextImages = nextImages.map((ad, j) => (j === i ? { ...ad, imageDataUrl: rotated } : ad));
        }
        const nextData: CaptureSessionData = { ...data, adImages: nextImages };
        setData(nextData);
        try {
          sessionStorage.setItem(CAPTURE_SESSION_KEY, JSON.stringify(nextData));
        } catch { }
        toast({ description: `${indices.length}장 회전 적용됨` });
      } catch {
        toast({ title: "회전 실패", variant: "destructive" });
      } finally {
        setImageRotating(false);
      }
    },
    [data, selectedImageIndices, toast]
  );

  const deleteImageAt = useCallback((index: number) => {
    if (!data?.adImages) return;
    if (!confirm("정말 이 사진을 삭제하시겠습니까?")) return;

    const nextImages = data.adImages.filter((_, i) => i !== index);
    const nextData = { ...data, adImages: nextImages };

    setEditedFilenames(prev => prev.filter((_, i) => i !== index));
    setGeneratedFilenames(prev => prev.filter((_, i) => i !== index));

    setSelectedIndices(prev => {
      const next = new Set<number>();
      Array.from(prev).forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });

    setSelectedImageIndices(prev => {
      const next = new Set<number>();
      Array.from(prev).forEach(i => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });

    setData(nextData);
    sessionStorage.setItem(CAPTURE_SESSION_KEY, JSON.stringify(nextData));
    toast({ description: "사진이 삭제되었습니다." });
  }, [data, toast]);

  const applyBulkReplace = useCallback(
    (target: "all" | "selected") => {
      const find = bulkFind.trim();
      if (!find) {
        toast({ title: "찾을 문자열을 입력해 주세요.", variant: "destructive" });
        return;
      }
      setEditedFilenames((prev) =>
        prev.map((name, i) => {
          const apply = target === "all" || selectedIndices.has(i);
          if (!apply) return name;
          return name.split(find).join(bulkReplace);
        })
      );
      toast({ title: "일괄 수정 적용됨" });
    },
    [bulkFind, bulkReplace, selectedIndices, toast]
  );

  const setEditedFilenameAt = useCallback((index: number, value: string) => {
    setEditedFilenames((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }, []);

  const handleDownloadZip = useCallback(async () => {
    if (!data?.adImages || editedFilenames.length === 0) return;
    setDownloadLoading(true);
    try {
      const zip = new JSZip();
      for (let i = 0; i < data.adImages.length; i++) {
        const blob = dataUrlToBlob(data.adImages[i].imageDataUrl);
        const name = editedFilenames[i] ?? `image_${String(i + 1).padStart(2, "0")}.jpg`;
        zip.file(name, blob);
      }
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const advertiserRaw = metaForFilename?.advertiser ?? advertiserLabel ?? "광고주미인식";
      const advertiserSafe = advertiserRaw.replace(/[/\\:*?"<>|]/g, "_").trim() || "광고주미인식";
      a.download = `${advertiserSafe}_촬영_${format(new Date(), "yyyyMMdd_HHmm")}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "ZIP 다운로드 완료" });
    } catch (e) {
      toast({
        title: "다운로드 실패",
        description: e instanceof Error ? e.message : "ZIP 생성 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setDownloadLoading(false);
    }
  }, [data?.adImages, editedFilenames, metaForFilename?.advertiser, advertiserLabel, toast]);

  const handleSendReport = useCallback(async (skipAiAnalysis?: boolean) => {
    if (!matchedAdvertiserId) {
      toast({
        title: "보고 발송 불가",
        description: "광고주가 인식된 촬영만 보고 발송할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }
    setReportSending(true);
    toast({ title: "보고 발송 중", description: "요청을 처리하고 있습니다." });
    try {
      let zipBase64: string | undefined;
      let zipFilename: string | undefined;
      if (data?.adImages && editedFilenames.length > 0) {
        const zip = new JSZip();
        for (let i = 0; i < data.adImages.length; i++) {
          const blob = dataUrlToBlob(data.adImages[i].imageDataUrl);
          const name = editedFilenames[i] ?? `image_${String(i + 1).padStart(2, "0")}.jpg`;
          zip.file(name, blob);
        }
        const blob = await zip.generateAsync({ type: "blob" });
        zipBase64 = await new Promise<string>((res, rej) => {
          const r = new FileReader();
          r.onload = () => {
            const dataUrl = r.result as string;
            res(dataUrl.split(",")[1] ?? "");
          };
          r.onerror = rej;
          r.readAsDataURL(blob);
        });
        const advSafe = (metaForFilename?.advertiser ?? "").replace(/[/\\:*?"<>|]/g, "_").trim() || "광고주미인식";
        zipFilename = `${advSafe}_촬영_${metaForFilename?.dateStr ?? format(new Date(), "yyyyMMdd")}_${format(new Date(), "HHmm")}.zip`;
      }

      const REPORT_SEND_TIMEOUT_MS = 90_000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), REPORT_SEND_TIMEOUT_MS);
      let res: Response;
      try {
        res = await fetch("/api/capture/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            advertiserId: matchedAdvertiserId,
            advertiserName: metaForFilename?.advertiser ?? advertiserLabel ?? undefined,
            primaryRecipient,
            senderNameOption,
            loginUserName: profile?.name ?? "",
            userEnteredName: userEnteredName.trim() || undefined,
            locationLabel: addressLabel?.trim() || undefined,
            station: stationName ?? metaForFilename?.station ?? undefined,
            line: subwayLine ?? metaForFilename?.line ?? undefined,
            imageCount: data?.adImages?.length ?? 0,
            dateStr: metaForFilename?.dateStr ?? format(new Date(), "yyyyMMdd"),
            zipBase64,
            zipFilename,
            includePpt: skipAiAnalysis ? undefined : (matchedAdvertiserId && !data?.skipLocation ? true : undefined),
            displayDays: skipAiAnalysis ? undefined : (displayDays && displayDays >= 1 ? displayDays : 7),
            skipAiAnalysis: skipAiAnalysis === true ? true : undefined,
          }),
          signal: controller.signal,
        });
      } finally {
        clearTimeout(timeoutId);
      }

      let json: { ok?: boolean; message?: string; error?: string | { code?: string; message?: string }; savedToHistory?: boolean };
      try {
        json = (await res.json()) as typeof json;
      } catch {
        toast({
          title: "발송 실패",
          description: "서버 응답을 확인할 수 없습니다. 네트워크 또는 서버 오류일 수 있습니다.",
          variant: "destructive",
        });
        return;
      }

      if (res.ok && (json.ok || json.savedToHistory)) {
        const desc = json.savedToHistory && !json.ok
          ? `보고서는 저장되었으나 이메일 발송에 실패했습니다: ${json.message}`
          : json.message;

        toast({
          title: json.ok ? "보고 발송 완료" : "보고서 저장 완료 (메일 실패)",
          description: desc,
          variant: json.ok ? "default" : "destructive",
        });
        router.push("/reports");
      } else if (json.error === "AI_ANALYSIS_TIMEOUT") {
        setShowAiTimeoutSheet(true);
      } else {
        const msg = typeof json.error === "string" ? json.error : (json.message ?? "오류가 발생했습니다.");
        toast({ title: "발송 실패", description: msg, variant: "destructive" });
      }
    } catch (e) {
      const isAbort = e instanceof Error && e.name === "AbortError";
      const msg = isAbort
        ? "요청이 시간 초과되었습니다. 잠시 후 다시 시도해 주세요."
        : e instanceof Error ? e.message : "발송 중 오류가 발생했습니다.";
      toast({ title: "발송 실패", description: String(msg), variant: "destructive" });
    } finally {
      setReportSending(false);
    }
  }, [matchedAdvertiserId, data?.adImages, editedFilenames, metaForFilename, stationName, subwayLine, advertiserLabel, addressLabel, primaryRecipient, senderNameOption, userEnteredName, profile?.name, toast, router, displayDays, data?.skipLocation]);

  if (!data) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Info className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-600 mb-6">촬영 데이터가 없습니다. 새로운 촬영을 시작해 주세요.</p>
        <Button asChild onClick={() => router.push("/capture")}>
          <span>촬영하러 가기</span>
        </Button>
      </div>
    );
  }

  const isMultiSession = true; // Simplified for this context as we mainly deal with multi-image flow
  const hasGps = data?.lat != null && data?.lng != null;
  const locationText = addressLabel || (hasGps ? `${data.lat?.toFixed(6)}, ${data.lng?.toFixed(6)}` : FALLBACK.location);

  return (
    <div className="min-h-screen bg-slate-50 pb-[100px] safe-area-padding-bottom relative">
      <div className="container px-4 pt-4 pb-8 max-w-lg mx-auto">

        {/* Header */}
        <header className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="-ml-2 text-slate-600 hover:bg-slate-100/50" onClick={() => router.back()}>
              <ChevronLeft className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">결과 확인</h1>
          </div>
          <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
            {format(new Date(data.capturedAt || new Date()), "MM.dd HH:mm")}
          </div>
        </header>

        {/* 1. Location Card */}
        <Card className="mb-4 border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          {data.locationImage ? (
            <div className="relative h-40 bg-slate-900/5">
              <img src={data.locationImage} alt="Location" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                <div className="text-white">
                  <p className="font-bold text-lg flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-cyan-400" />
                    {stationName && stationName !== "미인식" ? stationName : "역명 미인식"}
                  </p>
                  <p className="text-xs opacity-80 pl-6">{locationText.slice(0, 30)}</p>
                </div>
              </div>
            </div>
          ) : (
            data.skipLocation && (
              <div className="p-4 bg-amber-50/50 flex items-center gap-3 text-amber-700">
                <MapPinOff className="h-5 w-5 shrink-0" />
                <div>
                  <p className="font-semibold text-sm">위치 없음 모드</p>
                  <p className="text-xs opacity-80">역명 및 위치 정보 없이 저장됩니다.</p>
                </div>
              </div>
            )
          )}

          {/* Station Editor (Only if location exists) */}
          {data.locationImage && (
            <CardContent className="pt-4 pb-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 pl-1">역명</Label>
                  <Input
                    value={stationName || ""}
                    onChange={e => setStationName(e.target.value)}
                    className="bg-slate-50 border-slate-200 h-9"
                    placeholder="예: 강남역"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-500 pl-1">호선</Label>
                  <Input
                    value={subwayLine || ""}
                    onChange={e => setSubwayLine(e.target.value)}
                    className="bg-slate-50 border-slate-200 h-9"
                    placeholder="예: 2호선"
                  />
                </div>
              </div>
            </CardContent>
          )}
        </Card>

        {/* 2. Photo Grid & Advertiser */}
        <Card className="mb-4 border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <CardHeader className="pb-3 pt-5 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <FileImage className="h-4 w-4 text-indigo-500" />
                광고 사진 <span className="text-slate-400 font-normal text-sm">({data.adImages.length})</span>
              </CardTitle>
              <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={selectAllImages}>
                전체 선택
              </Button>
            </div>
          </CardHeader>

          <CardContent className="pt-4">
            <div className="grid grid-cols-3 gap-2 mb-6">
              {data.adImages.map((ad, i) => (
                <div key={i} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group border border-slate-100">
                  <img src={ad.imageDataUrl} alt={`Ad ${i}`} className="w-full h-full object-cover" />
                  <Checkbox
                    checked={selectedImageIndices.has(i)}
                    onCheckedChange={() => toggleImageSelection(i)}
                    className="absolute top-1 left-1 border-white data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 shadow-sm"
                  />
                  {/* Edit Actions Overlay */}
                  <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[1px] p-1 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => rotateImageAt(i, "left")} className="text-white hover:text-indigo-300"><RotateCcw className="h-3.5 w-3.5" /></button>
                    <button onClick={() => deleteImageAt(i)} className="text-white hover:text-red-300"><Trash2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => rotateImageAt(i, "right")} className="text-white hover:text-indigo-300"><RotateCw className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Tools row */}
            <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-none mb-2">
              <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => rotateSelected("left")}>
                <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> 선택 회전 (좌)
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-xs shrink-0" onClick={() => rotateSelected("right")}>
                <RotateCw className="h-3.5 w-3.5 mr-1.5" /> 선택 회전 (우)
              </Button>
            </div>

            {/* Advertiser Info */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                <Building2 className="h-4 w-4 text-slate-400" />
                {advertiserLabel || "광고주 미인식"}
              </div>
              {/* Filename Editor Accordion (Simplified) */}
              <div className="space-y-2 pt-2 border-t border-slate-200/60">
                <Label className="text-xs text-slate-500">사용자 직접 기입명 (파일명 추가)</Label>
                <Input
                  value={userEnteredName}
                  onChange={(e) => setUserEnteredName(e.target.value)}
                  placeholder="예: A구역_전광판"
                  className="h-8 text-sm bg-white"
                />
                <div className="flex items-center gap-2 bg-slate-100 p-2 rounded text-[10px] text-slate-500 font-mono overflow-x-auto whitespace-nowrap">
                  <span className="shrink-0 font-bold">저장 예시:</span>
                  {editedFilenames[0] || "..."}
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="w-full h-8 text-xs mt-2"
                  onClick={handleDownloadZip}
                  disabled={downloadLoading}
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  {downloadLoading ? "압축 중..." : "파일명 적용하여 ZIP 다운로드"}
                </Button>
              </div>
            </div>

          </CardContent>
        </Card>

        {/* 3. Settings Card */}
        {matchedAdvertiserId && (
          <Card className="mb-20 border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 pt-5 border-b border-slate-50">
              <CardTitle className="text-base">보고서 설정</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">수신자</Label>
                  <select
                    value={primaryRecipient}
                    onChange={(e) => setPrimaryRecipient(e.target.value as any)}
                    className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
                  >
                    <option value="campaign">캠페인 담당자 (참조: 공란)</option>
                    <option value="advertiser">광고주 담당자 (참조: 캠페인)</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">게재 기간 (PPT 표시)</Label>
                  <Input
                    type="number"
                    value={displayDays}
                    onChange={(e) => setDisplayDays(Number(e.target.value))}
                    className="h-9"
                    min={1}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sticky Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] pb-safe-area-bottom">
        <div className="container max-w-lg mx-auto p-4 flex gap-3">
          <Button
            variant="outline"
            className="flex-1 h-12 border-slate-300 text-slate-700 hover:bg-slate-50 font-medium"
            disabled={reportSending}
            onClick={() => handleSendReport(true)}
          >
            사진만 전송
          </Button>
          <Button
            className="flex-[2] h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-500/20"
            disabled={reportSending || !matchedAdvertiserId}
            onClick={() => handleSendReport(false)}
          >
            {reportSending ? "전송 중..." : "AI 보고서 전송"}
            {!reportSending && <Send className="ml-2 h-4 w-4" />}
          </Button>
        </div>
        {/* Warning if no advertiser matched */}
        {!matchedAdvertiserId && !reportSending && (
          <div className="bg-amber-50 text-amber-800 text-xs text-center py-1.5 border-t border-amber-100 absolute top-[-30px] left-0 right-0">
            광고주 미인식 상태입니다. 사진만 전송하거나 직접 ZIP을 다운로드하세요.
          </div>
        )}
      </div>

      {/* Sheets (Errors/Prompts) */}
      <Sheet open={showNoStationSheet} onOpenChange={setShowNoStationSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              역명 인식 실패
            </SheetTitle>
            <SheetDescription>
              역명을 자동으로 찾지 못했습니다. 직접 입력하거나 다시 촬영해주세요.
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push('/capture')}>재촬영</Button>
            <Button className="flex-1" onClick={() => setShowNoStationSheet(false)}>직접 입력</Button>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={showAiTimeoutSheet} onOpenChange={setShowAiTimeoutSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="text-left mb-6">
            <SheetTitle>AI 분석 시간 초과</SheetTitle>
            <SheetDescription>
              AI 보고서 생성에 시간이 너무 오래 걸립니다. 다시 시도하거나 사진만 보낼까요?
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setShowAiTimeoutSheet(false); handleSendReport(); }}>재시도</Button>
            <Button className="flex-1" onClick={() => { setShowAiTimeoutSheet(false); handleSendReport(true); }}>사진만 전송</Button>
          </div>
        </SheetContent>
      </Sheet>

    </div>
  );
}
