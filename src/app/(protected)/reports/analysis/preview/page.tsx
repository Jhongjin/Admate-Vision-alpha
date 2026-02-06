"use client";

import { useEffect, useState } from "react";
import { RotateCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { ReportAnalysisView, type ReportDataWithAnalysis } from "../report-analysis-view";

export default function AnalysisPreviewPage() {
  const [report, setReport] = useState<ReportDataWithAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPreview() {
      try {
        const res = await fetch("/api/capture/ai-analysis-preview");
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.message ?? "미리보기 데이터를 불러올 수 없습니다.");
        }
        const data = (await res.json()) as ReportDataWithAnalysis;
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
      } finally {
        setLoading(false);
      }
    }

    fetchPreview();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <RotateCw className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-slate-500">AI 분석 생성 중... (Gemini API 호출)</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Card className="max-w-md w-full border-red-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              미리보기 오류
            </CardTitle>
            <CardDescription>{error ?? "데이터를 불러올 수 없습니다."}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <Link href="/reports">목록으로 돌아가기</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <ReportAnalysisView report={report} isPreview />;
}
