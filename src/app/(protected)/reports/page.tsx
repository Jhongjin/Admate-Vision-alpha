"use client";

import Link from "next/link";
import { FileText, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const DUMMY_REPORTS = [
  {
    id: "1",
    advertiser: "(주)더미광고주",
    location: "서울시 강남구 테헤란로 123",
    sentAt: "2026-02-03 14:35",
    status: "발송 완료",
  },
  {
    id: "2",
    advertiser: "(주)샘플광고",
    location: "서울시 서초구 서초대로 456",
    sentAt: "2026-02-03 11:20",
    status: "발송 완료",
  },
  {
    id: "3",
    advertiser: "테스트코리아",
    location: "경기도 성남시 분당구 판교로 789",
    sentAt: "2026-02-02 16:00",
    status: "발송 완료",
  },
];

export default function ReportsPage() {
  return (
    <div className="container py-8">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">보고 목록</h1>
          <p className="mt-1 text-secondary-500">
            발송한 광고 게재 현황 보고 이력입니다. (목업)
          </p>
        </div>
        <Button asChild>
          <Link href="/capture" className="gap-2">
            <FileText className="h-4 w-4" />
            새 촬영
          </Link>
        </Button>
      </header>

      <ul className="space-y-4">
        {DUMMY_REPORTS.map((report) => (
          <li key={report.id}>
            <Card className="border-secondary-200">
              <CardHeader className="pb-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium text-gray-900">
                    {report.advertiser}
                  </span>
                  <Badge variant="secondary" className="bg-accent-500/10 text-accent-500">
                    {report.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-secondary-500">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 shrink-0" />
                  {report.location}
                </div>
                <p className="text-xs">발송 시각: {report.sentAt}</p>
              </CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
