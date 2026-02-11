"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import JSZip from "jszip";
import {
  MapPin,
  Building2,
  Send,
  FileImage,
  Download,
  RotateCcw,
  RotateCw,
  MapPinOff,
  Trash2,
  ChevronLeft,
  AlertCircle,
  Info,
  Train,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { useCaptureStore } from "@/features/capture/store/use-capture-store";
import type { StationVisit } from "@/features/capture/types";

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

// ─── Per-visit resolved metadata ───
type VisitMeta = {
  visitId: string;
  stationName: string;
  subwayLine: string;
  advertiserName: string;
  advertiserId: string | null;
  dateStr: string;
  filenames: string[];
  loading: boolean;
};

export default function CaptureConfirmV2Page() {
  // ── Zustand store ──
  const {
    getAllVisits,
    removeVisit: storeRemoveVisit,
    removeAdImage: storeRemoveAdImage,
    resetAll,
  } = useCaptureStore();

  // ── Visits from store ──
  const storeVisits = useMemo(() => {
    return getAllVisits();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getAllVisits]);

  // ── Per-visit metadata ──
  const [visitMetas, setVisitMetas] = useState<VisitMeta[]>([]);

  // ── Shared state ──
  const [userEnteredName, setUserEnteredName] = useState("");
  const [matchedAdvertiserId, setMatchedAdvertiserId] = useState<string | null>(null);
  const [advertiserLabel, setAdvertiserLabel] = useState<string | null>(null);
  const [primaryRecipient, setPrimaryRecipient] = useState<"advertiser" | "campaign">("campaign");
  const [senderNameOption, setSenderNameOption] = useState<"user" | "campaign">("user");
  const [displayDays, setDisplayDays] = useState(7);

  // UI states
  const [selectedImageIndices, setSelectedImageIndices] = useState<Set<string>>(new Set());
  const [metaLoading, setMetaLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  const [showNoStationSheet, setShowNoStationSheet] = useState(false);
  const [hasShownNoStationSheet, setHasShownNoStationSheet] = useState(false);
  const [showAiTimeoutSheet, setShowAiTimeoutSheet] = useState(false);

  const router = useRouter();
  const { toast } = useToast();
  const { data: advertisersData } = useAdvertisers();
  const advertisers = advertisersData ?? [];
  const { profile } = useUserProfile();

  // ─── Resolve metadata for each visit from store ───
  useEffect(() => {
    if (storeVisits.length === 0) return;

    setMetaLoading(true);

    const initialMetas: VisitMeta[] = storeVisits.map((v) => ({
      visitId: v.visitId,
      stationName: v.stationName || FALLBACK.station,
      subwayLine: v.subwayLine || FALLBACK.line,
      advertiserName: v.recognizedAdvertiser?.name || FALLBACK.advertiser,
      advertiserId: v.recognizedAdvertiser?.id || null,
      dateStr: v.adImages[0]?.capturedAt
        ? format(new Date(v.adImages[0].capturedAt), "yyyyMMdd")
        : format(new Date(), "yyyyMMdd"),
      filenames: [],
      loading: true,
    }));
    setVisitMetas(initialMetas);

    const firstAdv = storeVisits.find((v) => v.recognizedAdvertiser);
    if (firstAdv?.recognizedAdvertiser) {
      setMatchedAdvertiserId(firstAdv.recognizedAdvertiser.id);
      setAdvertiserLabel(firstAdv.recognizedAdvertiser.name);
    }

    Promise.all(
      storeVisits.map(async (visit, visitIdx) => {
        const ads = visit.adImages;
        const dateStr = visit.locationCapturedAt
          ? format(new Date(visit.locationCapturedAt), "yyyyMMdd")
          : ads[0]?.capturedAt
            ? format(new Date(ads[0].capturedAt), "yyyyMMdd")
            : format(new Date(), "yyyyMMdd");

        let resolvedStation = visit.stationName || FALLBACK.station;
        let resolvedLine = visit.subwayLine || FALLBACK.line;

        if (visit.locationImage && resolvedStation === FALLBACK.station) {
          try {
            const [locOcrResult, lineFromColor] = await Promise.all([
              runOcr(visit.locationImage),
              getSubwayLineFromImage(visit.locationImage),
            ]);
            const locOcrText = locOcrResult.textForStation ?? locOcrResult.text;
            const station = parseStationFromOcr(locOcrText);
            resolvedStation = station.stationName ?? FALLBACK.station;
            resolvedLine = station.line ?? lineFromColor ?? FALLBACK.line;
          } catch {
            // keep defaults
          }
        }

        let advertiserName = visit.recognizedAdvertiser?.name || FALLBACK.advertiser;
        let advertiserId = visit.recognizedAdvertiser?.id || null;

        if (!visit.recognizedAdvertiser && ads[0]?.imageDataUrl) {
          try {
            const ocrBody = await runOcr(ads[0].imageDataUrl);
            const match = matchOcrToAdvertiser(ocrBody.text, advertisers as AdvertiserForMatch[]);
            if (match) {
              advertiserName = match.advertiserName;
              advertiserId = match.advertiserId;
              if (visitIdx === 0) {
                setMatchedAdvertiserId(match.advertiserId);
                setAdvertiserLabel(match.advertiserName);
              }
            }
          } catch {
            // keep defaults
          }
        }

        const filenames = ads.map((_, i) =>
          visit.skipLocation
            ? buildNoLocationFilename(advertiserName, "", dateStr, i + 1)
            : buildCaptureFilename(advertiserName, resolvedLine, resolvedStation, "", dateStr, i + 1)
        );

        return {
          visitId: visit.visitId,
          stationName: resolvedStation,
          subwayLine: resolvedLine,
          advertiserName,
          advertiserId,
          dateStr,
          filenames,
          loading: false,
        } satisfies VisitMeta;
      })
    )
      .then((metas) => {
        setVisitMetas(metas);
        const hasUnresolved = metas.some(
          (m, i) =>
            storeVisits[i]?.locationImage &&
            (m.stationName === FALLBACK.station || m.stationName === "미인식")
        );
        if (hasUnresolved && !hasShownNoStationSheet) {
          setShowNoStationSheet(true);
          setHasShownNoStationSheet(true);
        }
      })
      .finally(() => setMetaLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeVisits.length, advertisers.length]);

  // ─── Regenerate filenames when userEnteredName changes ───
  useEffect(() => {
    if (visitMetas.length === 0) return;

    setVisitMetas((prev) =>
      prev.map((meta, idx) => {
        const visit = storeVisits[idx];
        if (!visit) return meta;
        const ads = visit.adImages;
        const filenames = ads.map((_, i) =>
          visit.skipLocation
            ? buildNoLocationFilename(meta.advertiserName, userEnteredName, meta.dateStr, i + 1)
            : buildCaptureFilename(meta.advertiserName, meta.subwayLine, meta.stationName, userEnteredName, meta.dateStr, i + 1)
        );
        return { ...meta, filenames };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userEnteredName]);

  // ─── Derived ───
  const totalAdImages = storeVisits.reduce((sum, v) => sum + v.adImages.length, 0);
  const hasData = storeVisits.length > 0 && totalAdImages > 0;

  // ─── Handlers ───

  const toggleImageSelection = useCallback((key: string) => {
    setSelectedImageIndices((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleDeleteVisit = useCallback((visitId: string) => {
    if (!confirm("이 역의 모든 사진을 삭제하시겠습니까?")) return;
    storeRemoveVisit(visitId);
    setVisitMetas((prev) => prev.filter((m) => m.visitId !== visitId));
    toast({ description: "역 촬영이 삭제되었습니다." });
  }, [storeRemoveVisit, toast]);

  const handleDeleteImage = useCallback((visitId: string, imageIndex: number) => {
    if (!confirm("이 사진을 삭제하시겠습니까?")) return;
    storeRemoveAdImage(visitId, imageIndex);
    setVisitMetas((prev) =>
      prev.map((m) => {
        if (m.visitId !== visitId) return m;
        const newFilenames = m.filenames.filter((_, i) => i !== imageIndex);
        return { ...m, filenames: newFilenames };
      })
    );
    toast({ description: "사진이 삭제되었습니다." });
  }, [storeRemoveAdImage, toast]);

  const handleDownloadZip = useCallback(async () => {
    if (!hasData || visitMetas.length === 0) return;
    setDownloadLoading(true);
    try {
      const zip = new JSZip();
      storeVisits.forEach((visit, vIdx) => {
        const meta = visitMetas[vIdx];
        if (!meta) return;
        const stationFolder = storeVisits.length > 1
          ? `${meta.stationName}_${meta.subwayLine}/`
          : "";
        visit.adImages.forEach((ad, imgIdx) => {
          const blob = dataUrlToBlob(ad.imageDataUrl);
          const name = meta.filenames[imgIdx] ?? `image_${String(imgIdx + 1).padStart(2, "0")}.jpg`;
          zip.file(`${stationFolder}${name}`, blob);
        });
      });
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const advSafe = (advertiserLabel ?? "광고주미인식").replace(/[/\\:*?"<>|]/g, "_").trim();
      a.download = `${advSafe}_촬영_${format(new Date(), "yyyyMMdd_HHmm")}.zip`;
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
  }, [hasData, storeVisits, visitMetas, advertiserLabel, toast]);

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
      if (totalAdImages > 0 && visitMetas.length > 0) {
        const zip = new JSZip();
        storeVisits.forEach((visit, vIdx) => {
          const meta = visitMetas[vIdx];
          if (!meta) return;
          const stationFolder = storeVisits.length > 1
            ? `${meta.stationName}_${meta.subwayLine}/`
            : "";
          visit.adImages.forEach((ad, imgIdx) => {
            const blob = dataUrlToBlob(ad.imageDataUrl);
            const name = meta.filenames[imgIdx] ?? `image_${String(imgIdx + 1).padStart(2, "0")}.jpg`;
            zip.file(`${stationFolder}${name}`, blob);
          });
        });
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
        const advSafe = (advertiserLabel ?? "").replace(/[/\\:*?"<>|]/g, "_").trim() || "광고주미인식";
        const dateStr = visitMetas[0]?.dateStr ?? format(new Date(), "yyyyMMdd");
        zipFilename = `${advSafe}_촬영_${dateStr}_${format(new Date(), "HHmm")}.zip`;
      }

      const visitsPayload = visitMetas.map((meta, idx) => {
        const visit = storeVisits[idx];
        return {
          station: meta.stationName !== FALLBACK.station ? meta.stationName : undefined,
          line: meta.subwayLine !== FALLBACK.line ? meta.subwayLine : undefined,
          imageCount: visit?.adImages.length ?? 0,
          dateStr: meta.dateStr,
          skipLocation: visit?.skipLocation ?? false,
        };
      });

      const firstMeta = visitMetas[0];
      const firstVisit = storeVisits[0];

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
            advertiserName: advertiserLabel ?? undefined,
            primaryRecipient,
            senderNameOption,
            loginUserName: profile?.name ?? "",
            userEnteredName: userEnteredName.trim() || undefined,
            station: firstMeta?.stationName !== FALLBACK.station ? firstMeta?.stationName : undefined,
            line: firstMeta?.subwayLine !== FALLBACK.line ? firstMeta?.subwayLine : undefined,
            imageCount: totalAdImages,
            dateStr: firstMeta?.dateStr ?? format(new Date(), "yyyyMMdd"),
            zipBase64,
            zipFilename,
            includePpt: skipAiAnalysis ? undefined : (matchedAdvertiserId && !firstVisit?.skipLocation ? true : undefined),
            displayDays: skipAiAnalysis ? undefined : (displayDays && displayDays >= 1 ? displayDays : 7),
            skipAiAnalysis: skipAiAnalysis === true ? true : undefined,
            visits: visitsPayload.length > 1 ? visitsPayload : undefined,
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
          description: "서버 응답을 확인할 수 없습니다.",
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
        resetAll();
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
  }, [matchedAdvertiserId, storeVisits, visitMetas, advertiserLabel, primaryRecipient, senderNameOption, userEnteredName, profile?.name, toast, router, displayDays, totalAdImages, resetAll]);

  // ─── Empty state ───
  if (!hasData && !metaLoading) {
    return (
      <div className="container py-8 flex flex-col items-center justify-center min-h-[60vh] text-center">
        <Info className="h-12 w-12 text-slate-300 mb-4" />
        <p className="text-slate-600 mb-6">촬영 데이터가 없습니다. 새로운 촬영을 시작해 주세요.</p>
        <Button onClick={() => router.push("/capture-v2")}>
          <span>촬영하러 가기</span>
        </Button>
      </div>
    );
  }

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
          <div className="flex items-center gap-2">
            {storeVisits.length > 1 && (
              <div className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-medium px-2.5 py-1 rounded-full">
                <Train className="h-3 w-3" />
                {storeVisits.length}개 역
              </div>
            )}
            <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded-full">
              {format(new Date(), "MM.dd HH:mm")}
            </div>
          </div>
        </header>

        {/* Loading indicator */}
        {metaLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="text-sm text-slate-500 animate-pulse">사진 분석 중...</div>
          </div>
        )}

        {/* ─── Station Visit Cards ─── */}
        {!metaLoading && storeVisits.map((visit, vIdx) => {
          const meta = visitMetas[vIdx];
          if (!meta) return null;

          return (
            <Card key={visit.visitId} className="mb-4 border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">

              {/* Location Section */}
              {visit.locationImage ? (
                <div className="relative h-40 bg-slate-900/5">
                  <img src={visit.locationImage} alt="Location" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-4">
                    <div className="text-white flex-1">
                      <p className="font-bold text-lg flex items-center gap-1.5">
                        <MapPin className="h-4 w-4 text-cyan-400" />
                        {meta.stationName !== FALLBACK.station ? meta.stationName : "역명 미인식"}
                      </p>
                      <p className="text-xs opacity-80 pl-6">{meta.subwayLine}</p>
                    </div>
                    {storeVisits.length > 1 && (
                      <button
                        className="text-white/70 hover:text-red-400 transition-colors p-1"
                        onClick={() => handleDeleteVisit(visit.visitId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                visit.skipLocation && (
                  <div className="p-4 bg-amber-50/50 flex items-center gap-3 text-amber-700">
                    <MapPinOff className="h-5 w-5 shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">위치 없음 모드</p>
                      <p className="text-xs opacity-80">역명 및 위치 정보 없이 저장됩니다.</p>
                    </div>
                    {storeVisits.length > 1 && (
                      <button
                        className="text-amber-700/50 hover:text-red-500 transition-colors p-1"
                        onClick={() => handleDeleteVisit(visit.visitId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                )
              )}

              {/* Station Editor */}
              {visit.locationImage && (
                <CardContent className="pt-4 pb-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500 pl-1">역명</Label>
                      <Input
                        value={meta.stationName || ""}
                        onChange={(e) => {
                          setVisitMetas((prev) =>
                            prev.map((m) =>
                              m.visitId === visit.visitId ? { ...m, stationName: e.target.value } : m
                            )
                          );
                        }}
                        className="bg-slate-50 border-slate-200 h-9"
                        placeholder="예: 강남역"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-500 pl-1">호선</Label>
                      <Input
                        value={meta.subwayLine || ""}
                        onChange={(e) => {
                          setVisitMetas((prev) =>
                            prev.map((m) =>
                              m.visitId === visit.visitId ? { ...m, subwayLine: e.target.value } : m
                            )
                          );
                        }}
                        className="bg-slate-50 border-slate-200 h-9"
                        placeholder="예: 2호선"
                      />
                    </div>
                  </div>
                </CardContent>
              )}

              {/* Ad Photos Grid */}
              <CardContent className={cn("pt-4", !visit.locationImage && !visit.skipLocation && "pt-5")}>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-slate-700 flex items-center gap-1.5">
                    <FileImage className="h-3.5 w-3.5 text-indigo-500" />
                    광고 사진 <span className="text-slate-400 font-normal">({visit.adImages.length})</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {visit.adImages.map((ad, imgIdx) => {
                    const imgKey = `${visit.visitId}:${imgIdx}`;
                    return (
                      <div key={imgKey} className="relative aspect-square rounded-lg overflow-hidden bg-slate-100 group border border-slate-100">
                        <img src={ad.imageDataUrl} alt={`Ad ${imgIdx}`} className="w-full h-full object-cover" />
                        <Checkbox
                          checked={selectedImageIndices.has(imgKey)}
                          onCheckedChange={() => toggleImageSelection(imgKey)}
                          className="absolute top-1 left-1 border-white data-[state=checked]:bg-indigo-500 data-[state=checked]:border-indigo-500 h-4 w-4 shadow-sm"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-black/60 backdrop-blur-[1px] p-1 flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleDeleteImage(visit.visitId, imgIdx)} className="text-white hover:text-red-300">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        {meta.filenames[imgIdx] && (
                          <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[8px] px-1 py-0.5 truncate">
                            {meta.filenames[imgIdx]}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}

        {/* ─── Advertiser & Filename Section ─── */}
        {!metaLoading && hasData && (
          <Card className="mb-4 border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardContent className="pt-5 pb-5 space-y-3">
              <div className="flex items-center gap-2 text-sm text-slate-900 font-medium">
                <Building2 className="h-4 w-4 text-slate-400" />
                {advertiserLabel || "광고주 미인식"}
              </div>
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
                  {visitMetas[0]?.filenames[0] || "..."}
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
            </CardContent>
          </Card>
        )}

        {/* ─── Settings Card ─── */}
        {matchedAdvertiserId && !metaLoading && (
          <Card className="mb-20 border-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
            <CardHeader className="pb-3 pt-5 border-b border-slate-50">
              <CardTitle className="text-base">보고서 설정</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 basis-1/2">
                  <Label className="text-xs text-slate-500">수신자</Label>
                  <Select
                    value={primaryRecipient}
                    onValueChange={(val) => setPrimaryRecipient(val as "advertiser" | "campaign")}
                  >
                    <SelectTrigger className="w-full h-9 bg-white">
                      <SelectValue placeholder="수신자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="campaign">캠페인 담당자 (참조: 공란)</SelectItem>
                      <SelectItem value="advertiser">광고주 담당자 (참조: 캠페인)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 basis-1/2">
                  <Label className="text-xs text-slate-500">발신자 표시</Label>
                  <Select
                    value={senderNameOption}
                    onValueChange={(val) => setSenderNameOption(val as "user" | "campaign")}
                  >
                    <SelectTrigger className="w-full h-9 bg-white">
                      <SelectValue placeholder="발신자 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">{profile?.name || "사용자"} (직접 발송)</SelectItem>
                      <SelectItem value="campaign">AdMate 캠페인팀 (대리 발송)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-slate-500">게재 기간 (PDF 표시)</Label>
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
        {!matchedAdvertiserId && !reportSending && (
          <div className="bg-amber-50 text-amber-800 text-xs text-center py-1.5 border-t border-amber-100 absolute top-[-30px] left-0 right-0">
            광고주 미인식 상태입니다. 사진만 전송하거나 직접 ZIP을 다운로드하세요.
          </div>
        )}
      </div>

      {/* Sheets */}
      <Sheet open={showNoStationSheet} onOpenChange={setShowNoStationSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader className="text-left mb-6">
            <SheetTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              역명 인식 실패
            </SheetTitle>
            <SheetDescription>
              역명을 자동으로 찾지 못했습니다. 위 카드에서 직접 입력하거나 다시 촬영해주세요.
            </SheetDescription>
          </SheetHeader>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => router.push("/capture-v2")}>재촬영</Button>
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
