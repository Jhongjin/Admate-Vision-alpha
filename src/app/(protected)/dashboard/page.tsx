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
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-secondary-500">
          {profile?.name ?? email ?? "사용자"} 님, 환영합니다.
        </p>
      </header>

      <section className="mb-8 grid gap-4 sm:grid-cols-2">
        <Card className="border-secondary-200 bg-secondary-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-secondary-500">
              오늘 촬영 건수
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {DUMMY_STATS.todayCaptures}건
            </p>
          </CardContent>
        </Card>
        <Card className="border-secondary-200 bg-secondary-50">
          <CardContent className="pt-6">
            <p className="text-sm font-medium text-secondary-500">
              오늘 발송 건수
            </p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {DUMMY_STATS.todayReports}건
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="flex flex-wrap gap-4">
        <Button asChild size="lg">
          <Link href="/capture" className="gap-2">
            <Camera className="h-5 w-5" />
            촬영하기
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/reports" className="gap-2">
            <FileText className="h-5 w-5" />
            보고 목록
          </Link>
        </Button>
      </section>

      <section className="mt-8">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">최근 현황</h2>
        <div className="overflow-hidden rounded-lg border border-secondary-200">
          <Image
            alt="대시보드"
            src="https://picsum.photos/seed/dashboard/960/320"
            width={960}
            height={320}
            className="h-auto w-full object-cover"
          />
        </div>
      </section>
    </div>
  );
}
