"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Camera, FileText, MapPin, ChevronRight, Activity, Image as ImageIcon } from "lucide-react";
import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
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

function buildLocationLabel(row: ReportRow): string {
  const parts: string[] = [];
  if (row.line) parts.push(row.line);
  if (row.station) parts.push(row.station);
  return parts.length ? parts.join(" · ") : row.location_label || "위치 미정";
}

export default function DashboardPage() {
  const { email } = useRegisteredEmail();
  const { profile } = useUserProfile();

  const [reports, setReports] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ todayCount: 0 });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/reports")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then((data: { reports?: ReportRow[] }) => {
        if (cancelled) return;
        const list = data.reports ?? [];
        setReports(list);

        // Calculate Today's Stats
        const now = new Date();
        const todayStr = format(now, "yyyy-MM-dd");
        const todayCnt = list.filter(r => r.sent_at.startsWith(todayStr)).length;
        setStats({ todayCount: todayCnt });
      })
      .catch(() => {
        // ignore error
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, []);

  const recentReports = reports.slice(0, 6); // 2열 배치이므로 짝수 개수(6개)가 좋아 보임

  return (
    <div className="container py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">대시보드</h1>
        <p className="mt-1 text-slate-600">
          {profile?.name ?? email ?? "사용자"} 님, 환영합니다.
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        {/* 오늘 발송 건수 */}
        <Card className="border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">오늘 발송 건수</p>
              <div className="h-8 w-8 rounded-full bg-indigo-50 p-1.5 text-indigo-500">
                <FileText className="h-full w-full" />
              </div>
            </div>
            {loading ? (
              <Skeleton className="mt-2 h-9 w-16" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-indigo-600">
                {stats.todayCount}<span className="text-base font-medium text-slate-500 ml-1">건</span>
              </p>
            )}
          </CardContent>
        </Card>

        {/* 바로가기 카드 (촬영) */}
        <Card className="border-slate-100 bg-white shadow-sm transition-all hover:shadow-md cursor-pointer group" onClick={() => window.location.href = '/capture'}>
          <CardContent className="pt-6 flex flex-col justify-between h-full">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">새로운 촬영</p>
              <div className="h-8 w-8 rounded-full bg-cyan-50 p-1.5 text-cyan-500 group-hover:bg-cyan-100 transition-colors">
                <Camera className="h-full w-full" />
              </div>
            </div>
            <p className="mt-2 text-lg font-semibold text-slate-900 flex items-center gap-1 group-hover:text-cyan-700 transition-colors">
              촬영 시작하기 <ChevronRight className="h-4 w-4" />
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            최근 발송 현황
          </h2>
          <Button asChild variant="link" className="text-sm text-slate-500 hover:text-indigo-600">
            <Link href="/reports">전체 보기</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : recentReports.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            {recentReports.map((report) => (
              <Link key={report.id} href={`/reports`} className="block h-full">
                <div className="group relative flex h-full items-start gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-indigo-100 hover:bg-slate-50/50">
                  {/* Thumbnail Image */}
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                    {report.image_urls && report.image_urls.length > 0 ? (
                      <img
                        src={report.image_urls[0]}
                        alt="Thumbnail"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-400">
                        <ImageIcon className="h-8 w-8" />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col justify-between h-full w-full">
                    <div>
                      <div className="flex items-start justify-between">
                        <p className="font-semibold text-slate-900 group-hover:text-indigo-700 transition-colors line-clamp-1">
                          {report.advertiser_name}
                        </p>
                        {report.sent_to_email ? (
                          <Badge className="ml-2 shrink-0 bg-green-50 text-[10px] text-green-700 border-green-100 hover:bg-green-100 px-1.5 py-0.5 h-5">
                            발송됨
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="ml-2 shrink-0 text-[10px] px-1.5 py-0.5 h-5">미발송</Badge>
                        )}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="line-clamp-1">{buildLocationLabel(report)}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-slate-50 pt-2 text-xs text-slate-400">
                      <span>{format(new Date(report.sent_at), "MM.dd HH:mm")}</span>
                      <span className="flex items-center group-hover:text-indigo-500 transition-colors">
                        상세보기 <ChevronRight className="h-3 w-3 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center text-slate-500">
            <p>최근 발송된 보고서가 없습니다.</p>
            <Button asChild variant="link" className="mt-2 text-indigo-600">
              <Link href="/capture">첫 촬영 시작하기</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
