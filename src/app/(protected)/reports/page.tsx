"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, MapPin, Search, ChevronRight, FileSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { ko } from "date-fns/locale";

type ReportRow = {
  id: string;
  advertiser_id: string | null;
  advertiser_name: string;
  station: string | null;
  line: string | null;
  location_label: string | null;
  image_count: number | null;
  sent_at: string;
  sent_to_email: string | null;
  image_urls?: string[];
};

function formatSentAt(iso: string): string {
  try {
    return format(new Date(iso), "yyyy. MM. dd a h:mm", { locale: ko });
  } catch {
    return iso;
  }
}

function buildLocationLabel(row: ReportRow): string {
  const parts: string[] = [];
  if (row.line) parts.push(row.line);
  if (row.station) parts.push(row.station);
  return parts.length ? parts.join(" · ") : row.location_label || "위치 미정";
}

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/reports")
      .then((res) => {
        if (!res.ok) throw new Error(res.statusText);
        return res.json();
      })
      .then((data: { reports?: ReportRow[] }) => {
        if (!cancelled) setReports(data.reports ?? []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "목록을 불러오지 못했습니다.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="container py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">보고 목록</h1>
          <p className="mt-1 text-slate-500">
            발송한 광고 게재 현황 보고 이력입니다.
          </p>
        </div>
        <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
          <Link href="/capture" className="gap-2">
            <FileText className="h-4 w-4" />
            새 촬영
          </Link>
        </Button>
      </header>

      {loading && (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
          <Skeleton className="h-24 w-full rounded-lg" />
        </div>
      )}

      {error && (
        <p className="text-red-600">{error}</p>
      )}

      {!loading && !error && reports.length === 0 && (
        <Card className="border-slate-100 bg-white shadow-sm">
          <CardContent className="py-12 text-center text-slate-500">
            <p>아직 발송한 보고가 없습니다.</p>
            <Button asChild variant="link" className="mt-2 text-indigo-600">
              <Link href="/capture">첫 보고서 작성하기</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!loading && !error && reports.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap text-center">사진</th>
                  <th className="px-6 py-4 whitespace-nowrap">광고주</th>
                  <th className="px-6 py-4 whitespace-nowrap">위치 / 노선</th>
                  <th className="px-6 py-4 whitespace-nowrap">발송 상태</th>
                  <th className="px-6 py-4 whitespace-nowrap">발송 시각</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reports.map((report) => (
                  <tr key={report.id} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap w-[100px] text-center">
                      <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden mx-auto">
                        {report.image_urls && report.image_urls.length > 0 ? (
                          <img src={report.image_urls[0]} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-slate-300">
                            <FileText className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-semibold text-slate-900">{report.advertiser_name}</div>
                      <div className="text-xs text-slate-500 mt-1">이미지 {report.image_count ?? 0}장</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <MapPin className="h-3.5 w-3.5 text-slate-400" />
                        {buildLocationLabel(report)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {report.sent_to_email ? (
                        <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-green-200 shadow-none font-normal">
                          발송 완료
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-100 text-slate-500 font-normal">미발송</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500 whitespace-nowrap">
                      {formatSentAt(report.sent_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {report.station != null && report.station.trim() !== "" && report.station !== "미인식" && (
                          <Button asChild size="sm" variant="outline" className="h-8 text-xs border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700">
                            <Link href={`/reports/analysis/${report.id}`}>
                              <FileText className="mr-1 h-3.5 w-3.5" />
                              AI 분석
                            </Link>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900" title="상세 정보 및 수정">
                          <Link href={`/capture/confirm?sessionId=${report.id}`}>
                            <FileSearch className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
