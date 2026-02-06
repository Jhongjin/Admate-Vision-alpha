"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { RotateCw, AlertCircle, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ReportAnalysisView, type ReportDataWithAnalysis } from "../report-analysis-view";

type ReportData = Omit<ReportDataWithAnalysis, "ai_analysis"> & {
  ai_analysis: ReportDataWithAnalysis["ai_analysis"] | null;
};

export default function AnalysisReportPage() {
    const { id } = useParams() as { id: string };
    const [report, setReport] = useState<ReportData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        async function fetchReport() {
            try {
                const res = await fetch(`/api/reports/${id}`);
                if (!res.ok) {
                    throw new Error("리포트를 불러올 수 없습니다.");
                }
                const data = await res.json();
                setReport(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        }

        fetchReport();
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <RotateCw className="h-8 w-8 animate-spin text-indigo-600" />
                    <p className="text-slate-500">리포트 데이터를 불러오는 중...</p>
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
                            오류 발생
                        </CardTitle>
                        <CardDescription>{error || "리포트를 찾을 수 없습니다."}</CardDescription>
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

    const { ai_analysis } = report;

    if (!ai_analysis) {
        return (
            <div className="min-h-screen bg-slate-50 pb-20">
                <div className="sticky top-0 z-20 border-b border-indigo-100 bg-white/80 px-6 py-4 backdrop-blur-md">
                    <div className="mx-auto flex max-w-5xl items-center justify-between">
                        <Button asChild variant="ghost" size="sm" className="-ml-2 text-slate-500 hover:text-slate-900">
                            <Link href="/reports">
                                <ArrowLeft className="mr-1 h-4 w-4" />
                                뒤로
                            </Link>
                        </Button>
                    </div>
                </div>
                <main className="mx-auto mt-20 max-w-lg text-center px-6">
                    <Bot className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">AI 분석 데이터가 없습니다</h2>
                    <p className="text-slate-500 mb-8">
                        이 리포트에는 AI 분석 정보가 포함되지 않았습니다.<br />
                        발송 시 AI 분석 옵션이 선택되지 않았거나, 데이터가 충분하지 않을 수 있습니다.
                    </p>
                    <Button asChild>
                        <Link href="/reports">목록으로 돌아가기</Link>
                    </Button>
                </main>
            </div>
        );
    }

    return <ReportAnalysisView report={report as ReportDataWithAnalysis} isPreview={false} />;
}
