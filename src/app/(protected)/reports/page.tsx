"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

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
};

function formatSentAt(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function buildLocationLabel(row: ReportRow): string {
  const parts: string[] = [];
  if (row.line) parts.push(row.line);
  if (row.station) parts.push(row.station);
  if (row.location_label) parts.push(row.location_label);
  return parts.length ? parts.join(" · ") : "—";
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
        <ul className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <li key={i}>
              <Card className="border-slate-100 bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-48" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-4 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-50">
                    <Skeleton className="h-3 w-32" />
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
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
        <ul className="space-y-4">
          {reports.map((report) => (
            <li key={report.id}>
              <Card className="border-slate-100 bg-white shadow-sm transition-all hover:shadow-md hover:border-indigo-100">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 text-lg">
                      {report.advertiser_name}
                    </span>
                    <div className="pt-2 mt-2 border-t border-slate-50 flex items-center justify-between">
                      <Badge variant={report.advertiser_id ? "default" : "secondary"} className={report.advertiser_id ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200" : "bg-slate-100 text-slate-500"}>
                        {report.advertiser_id ? "전송 완료" : "미확인"}
                      </Badge>
                      <div className="flex gap-2">
                        {report.station != null && report.station.trim() !== "" && (
                          <Button asChild size="sm" variant="outline" className="h-7 text-xs border-indigo-100 bg-indigo-50/50 text-indigo-600 hover:bg-indigo-100 hover:text-indigo-700">
                            <Link href={`/reports/analysis/${report.id}`}>
                              <FileText className="mr-1 h-3 w-3" />
                              AI 분석
                            </Link>
                          </Button>
                        )}
                        <Button asChild size="sm" variant="ghost" className="h-7 w-7 p-0">
                          <Link href={`/capture/confirm?sessionId=${report.id}`}>
                            <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1.5 text-sm text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-slate-400" />
                    <span className="text-slate-600 font-medium">{buildLocationLabel(report)}</span>
                  </div>
                  {report.image_count != null && (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 shrink-0 text-slate-400" />
                      <span>이미지 {report.image_count}장</span>
                    </div>
                  )}
                  <p className="text-xs pt-2 text-slate-400 border-t border-slate-50 mt-3">
                    발송 시각: {formatSentAt(report.sent_at)}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
