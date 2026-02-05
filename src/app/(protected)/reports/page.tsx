"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">보고 목록</h1>
          <p className="mt-1 text-secondary-500">
            발송한 광고 게재 현황 보고 이력입니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/capture" className="gap-2">
            <FileText className="h-4 w-4" />
            새 촬영
          </Link>
        </Button>
      </header>

      {loading && (
        <p className="text-secondary-500">목록을 불러오는 중…</p>
      )}
      {error && (
        <p className="text-destructive-600">{error}</p>
      )}
      {!loading && !error && reports.length === 0 && (
        <p className="text-secondary-500">아직 발송한 보고가 없습니다.</p>
      )}
      {!loading && !error && reports.length > 0 && (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li key={report.id}>
              <Card className="border-secondary-200">
                <CardHeader className="pb-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-gray-900">
                      {report.advertiser_name}
                    </span>
                    <Badge variant="secondary" className="bg-accent-500/10 text-accent-500">
                      발송 완료
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-secondary-500">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {buildLocationLabel(report)}
                  </div>
                  {report.image_count != null && (
                    <p className="text-xs">이미지 {report.image_count}장</p>
                  )}
                  <p className="text-xs">발송 시각: {formatSentAt(report.sent_at)}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
