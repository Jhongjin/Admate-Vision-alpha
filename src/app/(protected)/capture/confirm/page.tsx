"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import JSZip from "jszip";
import { MapPin, Building2, Send, FileImage, Download, Replace, RotateCcw, RotateCw, MapPinOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
  /** 위치+광고 세션: 역명·호선·파일명 목록 */
  const [stationName, setStationName] = useState<string | null>(null);
  const [subwayLine, setSubwayLine] = useState<string | null>(null);
  const [generatedFilenames, setGeneratedFilenames] = useState<string[]>([]);
  const [editedFilenames, setEditedFilenames] = useState<string[]>([]);
  const [userEnteredName, setUserEnteredName] = useState("");
  const [metaForFilename, setMetaForFilename] = useState<{
    advertiser: string;
    line: string;
    station: string;
    dateStr: string;
  } | null>(null);
  /** 매칭된 광고주 ID (보고 발송 시 수신자 조회용) */
  const [matchedAdvertiserId, setMatchedAdvertiserId] = useState<string | null>(null);
  /** 보고 메일 수신자: 광고주 담당자(참조에 캠페인) / 캠페인 담당자(참조 공란) */
  const [primaryRecipient, setPrimaryRecipient] = useState<"advertiser" | "campaign">("campaign");
  /** 발신자 표기: 로그인 사용자 이름 / 캠페인 담당자 이름 */
  const [senderNameOption, setSenderNameOption] = useState<"user" | "campaign">("user");
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());
  /** 광고 사진 회전용: 선택된 이미지 인덱스 (전체선택·회전 적용 대상) */
  const [selectedImageIndices, setSelectedImageIndices] = useState<Set<number>>(new Set());
  const [imageRotating, setImageRotating] = useState(false);
  const [bulkFind, setBulkFind] = useState("");
  /** 역명 미인식 시 안내 시트 (재촬영/일단 저장) */
  const [showNoStationSheet, setShowNoStationSheet] = useState(false);
  const [hasShownNoStationSheet, setHasShownNoStationSheet] = useState(false);
  const [bulkReplace, setBulkReplace] = useState("");
  const [metaLoading, setMetaLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [reportSending, setReportSending] = useState(false);
  /** AI 성과 분석 타임아웃 시 선택 시트 (다시 시도 / AI 없이 발송) */
  const [showAiTimeoutSheet, setShowAiTimeoutSheet] = useState(false);
  /** 게재 기간(일). 0이면 빈 칸(미입력), 발송 시 0/미입력이면 7일로 전달. 'AI 보고서 보내기' 시 이메일에 리포트 링크 포함 시 사용 */
  const [displayDays, setDisplayDays] = useState(7);
  const router = useRouter();
  const { toast } = useToast();
  const { data: advertisersData } = useAdvertisers();
  const advertisers = advertisersData ?? [];
  const { profile } = useUserProfile();

  /* urlToBase64 removed */

  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId");

  useEffect(() => {
    if (sessionId) {
      // Load from DB
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
            locationImage: undefined, // Location image not currently stored separately as URL in many cases, or implies mixed in images? 
            // NOTE: DB doesn't distinguish location image clearly if not saved separately. Assuming adImages only for now.
            // If location image was saved, it might be in image_urls[0] or similar, but logic is tricky.
            // For report confirmation, main goal is to resend/download.
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

          // Set Filenames State
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
      // Load from SessionStorage
      try {
        const raw = sessionStorage.getItem(CAPTURE_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as CaptureSessionData;
          if (parsed.imageDataUrl || isLocationAdSession(parsed)) setData(parsed);
        }
      } catch {
        /* ignore */
      }
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

  /** 단일 이미지: 광고주 OCR (Supabase 광고주 목록만 사용) */
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

  /** 위치+광고 또는 위치없음+광고 세션: 역명·호선(있을 때만 OCR) → 광고주(첫 광고 이미지, Supabase 목록만 사용) → 파일명 생성 */
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
      setGeneratedFilenames(
        ads.map((_, i) =>
          session.skipLocation
            ? buildNoLocationFilename(FALLBACK.advertiser, "", dateStr, i + 1)
            : buildCaptureFilename(
              FALLBACK.advertiser,
              FALLBACK.line,
              FALLBACK.station,
              "",
              dateStr,
              i + 1
            )
        )
      );
    } finally {
      setMetaLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!data || !isLocationAdSession(data)) return;
    resolveMultiSessionMeta(data, advertisers);
  }, [data, advertisers, resolveMultiSessionMeta]);

  /** 자동 생성된 파일명이 바뀌면 편집용 목록도 동기화 */
  useEffect(() => {
    if (generatedFilenames.length > 0) {
      setEditedFilenames([...generatedFilenames]);
      setSelectedIndices(new Set(generatedFilenames.map((_, i) => i)));
    }
  }, [generatedFilenames]);

  /** 사용자직접기입명 또는 meta 변경 시 파일명 목록 재생성 (일괄 적용) */
  useEffect(() => {
    if (!data || !isLocationAdSession(data) || !metaForFilename || !data.adImages.length) return;
    setEditedFilenames(
      data.adImages.map((_, i) =>
        data.skipLocation
          ? buildNoLocationFilename(
            metaForFilename.advertiser,
            userEnteredName,
            metaForFilename.dateStr,
            i + 1
          )
          : buildCaptureFilename(
            metaForFilename.advertiser,
            metaForFilename.line,
            metaForFilename.station,
            userEnteredName,
            metaForFilename.dateStr,
            i + 1
          )
      )
    );
  }, [userEnteredName, metaForFilename, data]);

  /** 역명 미인식 시 한 번만 안내 시트 표시 (광고주 미인식과 동일한 UX) */
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

  const hasGps = data?.lat != null && data?.lng != null;
  const locationText = (() => {
    if (!hasGps || data?.lat == null || data?.lng == null) return FALLBACK.location;
    if (addressLoading) return "주소 조회 중...";
    if (addressLabel) return addressLabel;
    return `${data.lat.toFixed(6)}, ${data.lng.toFixed(6)}`;
  })();
  const accuracyText =
    hasGps && data?.accuracy != null
      ? ` · 약 ±${Math.round(data.accuracy)}m`
      : "";
  const mapsUrl =
    hasGps && data?.lat != null && data?.lng != null
      ? `https://www.google.com/maps?q=${data.lat},${data.lng}`
      : null;

  const isMultiSession = data != null && (isLocationAdSession(data) || (Array.isArray(data.adImages) && data.adImages.length > 0));
  const hasResolvedStation =
    !!stationName &&
    stationName !== FALLBACK.station &&
    !!subwayLine &&
    subwayLine !== FALLBACK.line;
  const canUsePpt = Boolean(
    matchedAdvertiserId &&
    isMultiSession &&
    !data?.skipLocation &&
    hasResolvedStation
  );

  const singleCapturedAt = data?.capturedAt ?? data?.locationCapturedAt;
  const capturedAtText = singleCapturedAt
    ? format(new Date(singleCapturedAt), "yyyy-MM-dd HH:mm")
    : "-";

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
    } catch {
      /* ignore */
    }
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
        } catch {
          /* ignore */
        }
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
    if (!isMultiSession || !data?.adImages || editedFilenames.length === 0) return;
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
  }, [isMultiSession, data?.adImages, editedFilenames, metaForFilename?.advertiser, advertiserLabel, toast]);

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
      if (isMultiSession && data?.adImages && editedFilenames.length > 0) {
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
            includePpt: skipAiAnalysis ? undefined : (canUsePpt ? true : undefined),
            displayDays: skipAiAnalysis ? undefined : (canUsePpt ? (displayDays && displayDays >= 1 ? displayDays : 7) : undefined),
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
      const errorMessage =
        typeof json.message === "string"
          ? json.message
          : typeof json.error === "object" && json.error && "message" in json.error
            ? String((json.error as { message?: string }).message ?? "오류가 발생했습니다.")
            : typeof json.error === "string"
              ? json.error
              : "이메일 발송에 실패했습니다.";
      if (res.ok && (json.ok || json.savedToHistory)) {
        const desc =
          json.savedToHistory && !json.ok
            ? `보고서는 저장되었으나 이메일 발송에 실패했습니다: ${json.message}`
            : json.message;

        toast({
          title: json.ok ? "보고 발송 완료" : "보고서 저장 완료 (메일 실패)",
          description: desc,
          variant: json.ok ? "default" : "destructive", // 메일 실패 시 주의 표시
        });
        router.push("/reports");
      } else if (json.error === "AI_ANALYSIS_TIMEOUT") {
        setShowAiTimeoutSheet(true);
      } else {
        toast({
          title: "발송 실패",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (e) {
      const isAbort = e instanceof Error && e.name === "AbortError";
      const msg = isAbort
        ? "요청이 시간 초과되었습니다. 잠시 후 다시 시도해 주세요."
        : e instanceof Error
          ? e.message
          : "발송 중 오류가 발생했습니다.";
      toast({ title: "발송 실패", description: String(msg), variant: "destructive" });
    } finally {
      setReportSending(false);
    }
  }, [
    matchedAdvertiserId,
    isMultiSession,
    data?.adImages,
    editedFilenames,
    metaForFilename,
    stationName,
    subwayLine,
    advertiserLabel,
    addressLabel,
    primaryRecipient,
    senderNameOption,
    userEnteredName,
    profile?.name,
    toast,
    router,
    canUsePpt,
    displayDays,
  ]);

  if (!data) {
    return (
      <div className="container py-8">
        <p className="text-secondary-500">촬영 데이터가 없습니다. 촬영 화면에서 다시 촬영해 주세요.</p>
        <Button asChild className="mt-4">
          <Link href="/capture">촬영하기</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 bg-slate-50 min-h-screen">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">촬영 확인</h1>
        <p className="mt-1 text-slate-500">
          촬영 내용을 확인한 뒤 보고를 발송하세요.
          {isMultiSession && " 저장 시 아래 파일명이 적용됩니다."}
        </p>
      </header>

      {isMultiSession ? (
        <>
          {data.skipLocation && (
            <Card className="mb-6 border-amber-200 bg-amber-50/50 shadow-sm">
              <CardHeader className="pb-2">
                <span className="text-sm font-bold text-amber-800 flex items-center gap-2">
                  <MapPinOff className="h-4 w-4" />
                  위치 없음 세션
                </span>
              </CardHeader>
              <CardContent className="text-sm text-amber-700">
                역명·호선은 미촬영 시 &quot;미인식&quot;으로 표시됩니다.
              </CardContent>
            </Card>
          )}
          {data.locationImage && (
            <Card className="mb-6 overflow-hidden border-slate-100 bg-white shadow-sm">
              <CardHeader className="pb-3 border-b border-slate-50">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-indigo-500" />
                  위치(역명) 사진
                </span>
              </CardHeader>
              <div className="relative aspect-video w-full bg-slate-100">
                <img
                  src={data.locationImage}
                  alt="역명판"
                  className="h-full w-full object-contain"
                />
              </div>
              {(metaLoading || stationName != null || subwayLine != null) && (
                <CardContent className="space-y-2 pt-4 text-sm">
                  {metaLoading ? (
                    <p className="text-slate-500 flex items-center gap-2">
                      <RotateCw className="h-3 w-3 animate-spin" />
                      역명·호선 인식 중...
                    </p>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 flex flex-col gap-1">
                        <span className="block text-xs text-slate-500 ml-1">역명</span>
                        <Input
                          className="h-8 text-sm border-slate-200 bg-white focus-visible:ring-indigo-500"
                          value={stationName ?? ""}
                          onChange={(e) => setStationName(e.target.value)}
                          placeholder={FALLBACK.station}
                        />
                      </div>
                      <div className="rounded-lg bg-slate-50 p-2 border border-slate-100 flex flex-col gap-1">
                        <span className="block text-xs text-slate-500 ml-1">호선</span>
                        <Input
                          className="h-8 text-sm border-slate-200 bg-white focus-visible:ring-indigo-500"
                          value={subwayLine ?? ""}
                          onChange={(e) => setSubwayLine(e.target.value)}
                          placeholder={FALLBACK.line}
                        />
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          )}

          <Card className="mb-6 overflow-hidden border-slate-100 bg-white shadow-sm">
            <CardHeader className="pb-3 border-b border-slate-50">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <FileImage className="h-4 w-4 text-indigo-500" />
                  광고 사진 ({data.adImages.length}장)
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs font-medium text-slate-600 hover:text-indigo-600 hover:bg-indigo-50"
                    onClick={selectAllImages}
                  >
                    전체 선택
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs border-slate-200"
                    disabled={selectedImageIndices.size === 0 || imageRotating}
                    onClick={() => rotateSelected("left")}
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    왼쪽 90°
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 gap-1 text-xs border-slate-200"
                    disabled={selectedImageIndices.size === 0 || imageRotating}
                    onClick={() => rotateSelected("right")}
                  >
                    <RotateCw className="h-3.5 w-3.5" />
                    오른쪽 90°
                  </Button>
                </div>
              </div>
            </CardHeader>
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 bg-slate-50/50">
              {data.adImages.map((ad, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-slate-200 ring-1 ring-slate-900/5 shadow-sm group">
                  <label className="absolute left-2 top-2 z-10 flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-sm px-2 py-1 transition-transform active:scale-95 cursor-pointer">
                    <Checkbox
                      checked={selectedImageIndices.has(i)}
                      onCheckedChange={() => toggleImageSelection(i)}
                      className="border-white/80 data-[state=checked]:bg-white data-[state=checked]:text-black h-3.5 w-3.5 rounded-full"
                    />
                    <span className="text-xs font-medium text-white shadow-black drop-shadow-md">{(i + 1).toString()}</span>
                  </label>
                  <img
                    src={ad.imageDataUrl}
                    alt={`광고 ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute bottom-2 right-2 flex gap-1 transition-opacity">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white"
                      disabled={imageRotating}
                      onClick={() => rotateImageAt(i, "left")}
                      title="왼쪽 90° 회전"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-7 w-7 rounded-full bg-white/90 text-slate-700 shadow-sm hover:bg-white"
                      disabled={imageRotating}
                      onClick={() => rotateImageAt(i, "right")}
                      title="오른쪽 90° 회전"
                    >
                      <RotateCw className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-7 w-7 rounded-full shadow-sm hover:bg-red-600"
                      onClick={() => deleteImageAt(i)}
                      title="사진 삭제"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            {editedFilenames.length > 0 && (
              <CardContent className="border-t border-slate-100 pt-6 space-y-4 bg-white">
                <div>
                  <Label htmlFor="user-entered-name" className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Replace className="h-4 w-4 text-indigo-500" />
                    사용자직접기입명 (추가 이름)
                  </Label>
                  <p className="text-xs text-slate-500 mt-1 mb-2">
                    파일명에 일괄 추가됩니다. 예: <span className="font-mono bg-slate-100 px-1 rounded">DL16</span> 입력 시 …_공덕_DL16_20260203_01.jpg
                  </p>
                  <Input
                    id="user-entered-name"
                    placeholder="예: DL16"
                    value={userEnteredName}
                    onChange={(e) => setUserEnteredName(e.target.value)}
                    className="max-w-sm border-slate-200 focus-visible:ring-indigo-500 h-10"
                  />
                </div>

                <p className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <FileImage className="h-4 w-4" />
                  저장 파일명 (다운로드·업로드 시 적용)
                </p>

                <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-600">일괄 수정</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs"
                      onClick={selectAll}
                    >
                      전체 선택
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2 items-end">
                    <div className="flex-1 min-w-[100px]">
                      <Label className="text-xs text-slate-600">찾을 문자열</Label>
                      <Input
                        placeholder="예: 5호선"
                        value={bulkFind}
                        onChange={(e) => setBulkFind(e.target.value)}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div className="flex-1 min-w-[100px]">
                      <Label className="text-xs text-slate-600">바꿀 문자열</Label>
                      <Input
                        placeholder="예: 8호선"
                        value={bulkReplace}
                        onChange={(e) => setBulkReplace(e.target.value)}
                        className="h-8 text-sm mt-0.5"
                      />
                    </div>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 gap-1"
                        onClick={() => applyBulkReplace("selected")}
                      >
                        <Replace className="h-3.5 w-3.5" />
                        선택 항목에 적용
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => applyBulkReplace("all")}
                      >
                        전체 적용
                      </Button>
                    </div>
                  </div>
                </div>

                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {editedFilenames.map((name, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <Checkbox
                        id={`fn-check-${i}`}
                        checked={selectedIndices.has(i)}
                        onCheckedChange={() => toggleSelectIndex(i)}
                        className="shrink-0"
                      />
                      <Input
                        id={`fn-${i}`}
                        value={name}
                        onChange={(e) => setEditedFilenameAt(i, e.target.value)}
                        className="h-8 text-xs font-mono flex-1 min-w-0"
                        placeholder="파일명"
                      />
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={downloadLoading || editedFilenames.length === 0}
                    onClick={handleDownloadZip}
                  >
                    <Download className="h-4 w-4" />
                    {downloadLoading ? "준비 중…" : "ZIP 다운로드"}
                  </Button>
                </div>

                {advertiserLabel != null && (
                  <p className="text-sm text-gray-600">
                    <Building2 className="inline h-4 w-4 align-middle" /> 인식 광고주: {advertiserLabel}
                  </p>
                )}
              </CardContent>
            )}
          </Card>
        </>
      ) : (
        <Card className="mb-6 overflow-hidden border-secondary-200">
          <div className="relative aspect-video w-full bg-gray-100">
            {data.imageDataUrl ? (
              <img
                src={data.imageDataUrl}
                alt="촬영 이미지"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-secondary-500">
                촬영 데이터가 없습니다.
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
        </Card>
      )}

      <Card className="border-secondary-200">
        {matchedAdvertiserId && (
          <CardContent className="border-b border-secondary-200 py-4 space-y-3">
            <p className="text-sm font-medium text-gray-900">보고 발송 설정</p>
            <div className="flex flex-wrap gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">수신자</Label>
                <select
                  value={primaryRecipient}
                  onChange={(e) => setPrimaryRecipient(e.target.value as "advertiser" | "campaign")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="advertiser">광고주 담당자 (참조: 캠페인 담당자)</option>
                  <option value="campaign">캠페인 담당자 (참조: 공란)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-slate-600">발신자 표기</Label>
                <select
                  value={senderNameOption}
                  onChange={(e) => setSenderNameOption(e.target.value as "user" | "campaign")}
                  className="h-9 rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="user">로그인 사용자 이름 ({profile?.name ?? "-"})</option>
                  <option value="campaign">캠페인 담당자 이름</option>
                </select>
              </div>
            </div>
            <div
              className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t-2 border-slate-200 bg-slate-50/80 rounded-lg px-4 py-3"
              data-report-ppt-section
            >
              {canUsePpt ? (
                <div className="flex items-center gap-2">
                  <Label htmlFor="display-days" className="text-xs text-slate-700">게재 기간(일)</Label>
                  <Input
                    id="display-days"
                    type="number"
                    min={1}
                    max={365}
                    placeholder="7"
                    value={displayDays >= 1 ? displayDays : ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v === "" || v == null) {
                        setDisplayDays(0);
                        return;
                      }
                      const n = Number(v);
                      if (!Number.isNaN(n)) setDisplayDays(Math.max(1, Math.min(365, n)));
                    }}
                    className="h-9 w-20 border-slate-300 bg-white text-gray-900"
                  />
                </div>
              ) : (
                <p className="w-full text-xs text-slate-500">
                  역명·호선과 광고주가 모두 인식된 위치 세션에서만 AI 보고서 링크가 이메일에 포함됩니다. (위치 없음 세션에서는 사진만 발송)
                </p>
              )}
            </div>
          </CardContent>
        )}
        <CardFooter className="flex flex-wrap gap-3 border-t border-secondary-200 pt-6">
          {hasGps && (
            <p className="flex flex-1 min-w-[200px] items-center gap-2 text-sm text-secondary-500">
              <MapPin className="h-4 w-4 shrink-0" />
              {locationText}
              {accuracyText}
            </p>
          )}
          <Button
            size="lg"
            className="gap-2"
            disabled={reportSending || data?.skipLocation === true}
            onClick={() => void handleSendReport()}
            title={data?.skipLocation === true ? "위치 없음 세션에서는 사진만 보내기를 이용해 주세요." : undefined}
          >
            <Send className="h-4 w-4" />
            {reportSending ? "발송 중..." : "AI 보고서 보내기"}
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="gap-2 bg-slate-200 text-slate-700 hover:bg-slate-300"
            disabled={reportSending}
            onClick={() => void handleSendReport(true)}
          >
            <FileImage className="h-4 w-4" />
            사진만 보내기
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/reports">보고 목록</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/capture">취소</Link>
          </Button>
        </CardFooter>
      </Card>

      <Sheet open={showNoStationSheet} onOpenChange={setShowNoStationSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>역명을 인식하지 못했습니다</SheetTitle>
            <SheetDescription>
              역명판에서 역명을 찾지 못했습니다. 재촬영하거나 일단 저장할 수 있습니다.
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="flex-row flex-wrap gap-3 sm:gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={() => {
                setShowNoStationSheet(false);
                router.push("/capture");
              }}
            >
              재촬영 시도
            </Button>
            <Button
              className="flex-1 min-w-[100px]"
              onClick={() => setShowNoStationSheet(false)}
            >
              일단 저장
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={showAiTimeoutSheet} onOpenChange={setShowAiTimeoutSheet}>
        <SheetContent side="bottom" className="rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>AI 성과 분석 생성 시간 초과</SheetTitle>
            <SheetDescription>
              AI 보고서 생성이 완료되지 않았습니다. 다시 시도하시겠습니까? 아니면 AI 분석 없이 발송하시겠습니까?
            </SheetDescription>
          </SheetHeader>
          <SheetFooter className="flex-row flex-wrap gap-3 sm:gap-3 mt-6">
            <Button
              variant="outline"
              className="flex-1 min-w-[100px]"
              onClick={() => {
                setShowAiTimeoutSheet(false);
                void handleSendReport();
              }}
            >
              다시 시도
            </Button>
            <Button
              className="flex-1 min-w-[100px]"
              onClick={() => {
                setShowAiTimeoutSheet(false);
                void handleSendReport(true);
              }}
            >
              AI 없이 발송
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
