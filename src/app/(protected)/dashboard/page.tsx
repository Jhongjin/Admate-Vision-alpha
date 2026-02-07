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
    <div className="container py-8 relative min-h-screen">
      {/* Decorative Background */}
      <div className="absolute top-0 right-0 -z-10 h-[300px] w-[300px] bg-indigo-50/50 blur-3xl opacity-50 rounded-full" />

      <header className="mb-8 relative z-10">
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">대시보드</h1>
        <p className="mt-2 text-slate-600">
          <span className="font-semibold text-indigo-600">{profile?.name ?? email ?? "사용자"}</span>님, 오늘도 힘찬 하루 되세요! ☀️
        </p>
      </header>

      <section className="mb-10 grid gap-6 md:grid-cols-2">
        {/* 오늘 발송 건수 */}
        <Card className="border-slate-100 bg-white shadow-sm transition-all hover:shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <FileText className="h-24 w-24 text-indigo-500 transform rotate-12" />
          </div>
          <CardContent className="pt-8 pb-8">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">오늘 발송한 보고서</p>
                {loading ? (
                  <Skeleton className="h-10 w-24" />
                ) : (
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-slate-900 tracking-tight">{stats.todayCount}</span>
                    <span className="text-lg font-medium text-slate-500">건</span>
                  </div>
                )}
              </div>
              <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-inner">
                <Activity className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 바로가기 카드 (촬영) */}
        <Card
          className="relative border-cyan-100 bg-gradient-to-br from-white to-cyan-50/30 shadow-sm transition-all hover:shadow-lg hover:shadow-cyan-100/50 hover:-translate-y-1 cursor-pointer group overflow-hidden"
          onClick={() => window.location.href = '/capture'}
        >
          <div className="absolute inset-0 bg-white/50 group-hover:bg-transparent transition-colors duration-500" />
          <CardContent className="pt-8 pb-8 flex items-center justify-between relative z-10 h-full">
            <div>
              <p className="text-sm font-semibold text-cyan-600 mb-1 flex items-center gap-1">
                New Capture <Camera className="h-3 w-3" />
              </p>
              <p className="text-2xl font-bold text-slate-900 group-hover:text-cyan-900 transition-colors">
                새로운 촬영 시작
              </p>
            </div>
            <div className="h-12 w-12 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-110 transition-transform duration-300">
              <ChevronRight className="h-6 w-6 ml-0.5" />
            </div>
          </CardContent>
        </Card>
      </section>

      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            📊 최근 보고 내역
          </h2>
          <Button asChild variant="ghost" className="text-sm text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
            <Link href="/reports" className="flex items-center gap-1">
              전체 보기 <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : recentReports.length > 0 ? (
          <div className="grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {recentReports.map((report) => (
              <Link key={report.id} href={`/reports`} className="block group">
                <article className="h-full flex flex-col rounded-2xl border border-slate-100 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.03)] transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] hover:-translate-y-1 hover:border-indigo-100 overflow-hidden">
                  {/* Image Area */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    {report.image_urls && report.image_urls.length > 0 ? (
                      <img
                        src={report.image_urls[0]}
                        alt="Thumbnail"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300 bg-slate-50">
                        <ImageIcon className="h-10 w-10" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      {report.sent_to_email ? (
                        <Badge className="bg-green-500/90 text-white border-none shadow-sm backdrop-blur-sm">
                          발송됨
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-slate-900/50 text-white border-none backdrop-blur-sm">
                          미발송
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 p-5 flex flex-col">
                    <div className="mb-3">
                      <h3 className="font-bold text-lg text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1 mb-1">
                        {report.advertiser_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-sm text-slate-500">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                        <span className="line-clamp-1 font-medium">{buildLocationLabel(report)}</span>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-slate-50 flex items-center justify-between text-xs text-slate-400">
                      <span>{format(new Date(report.sent_at), "yyyy.MM.dd HH:mm")}</span>
                      <span className="flex items-center group-hover:text-indigo-500 font-medium transition-colors">
                        상세보기
                      </span>
                    </div>
                  </div>
                </article>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-16 text-center text-slate-500">
            <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
              <FileText className="h-6 w-6 text-slate-400" />
            </div>
            <p className="text-lg font-medium text-slate-900">최근 발송된 보고서가 없습니다.</p>
            <p className="text-sm mt-1 mb-6">첫 번째 보고서를 작성해보세요!</p>
            <Button asChild className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
              <Link href="/capture">촬영 시작하기</Link>
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
