"use client";

import Image from "next/image";
import Link from "next/link";
import { Camera, FileText } from "lucide-react";
import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

const DUMMY_STATS = {
  todayCaptures: 12,
  todayReports: 8,
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;
  const { email } = useRegisteredEmail();
  const { profile } = useUserProfile();

  return (
    <div className="container py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">대시보드</h1>
        <p className="mt-1 text-slate-600">
          {profile?.name ?? email ?? "사용자"} 님, 환영합니다.
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                오늘 촬영 건수
              </p>
              <div className="h-8 w-8 rounded-full bg-indigo-50 p-1.5 text-indigo-500">
                <Camera className="h-full w-full" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-indigo-600">
              {DUMMY_STATS.todayCaptures}<span className="text-base font-medium text-slate-500 ml-1">건</span>
            </p>
          </CardContent>
        </Card>
        <Card className="border-slate-100 bg-white shadow-sm transition-all hover:shadow-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500">
                오늘 발송 건수
              </p>
              <div className="h-8 w-8 rounded-full bg-cyan-50 p-1.5 text-cyan-500">
                <FileText className="h-full w-full" />
              </div>
            </div>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {DUMMY_STATS.todayReports}<span className="text-base font-medium text-slate-500 ml-1">건</span>
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap gap-4">
        <Button asChild size="lg" className="h-12 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20">
          <Link href="/capture" className="gap-2">
            <Camera className="h-5 w-5" />
            촬영하기
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-12 border-slate-200 hover:bg-slate-50 hover:text-slate-900">
          <Link href="/reports" className="gap-2">
            <FileText className="h-5 w-5" />
            보고 목록
          </Link>
        </Button>
      </section>

      <section className="mt-10">
        <h2 className="mb-4 text-lg font-bold text-slate-900">최근 현황</h2>
        <div className="overflow-hidden rounded-2xl border border-slate-200/60 shadow-lg shadow-slate-200/10">
          <Image
            alt="대시보드"
            src="https://picsum.photos/seed/dashboard/960/320"
            width={960}
            height={320}
            className="h-auto w-full object-cover transition-transform hover:scale-105 duration-700"
          />
        </div>
      </section>
    </div>
  );
}
