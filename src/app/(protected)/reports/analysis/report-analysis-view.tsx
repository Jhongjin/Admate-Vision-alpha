"use client";

import { useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Download,
  Share2,
  MapPin,
  Calendar,
  TrendingUp,
  Users,
  Bot,
  Quote,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface AiAnalysisResult {
  analysisText: string;
  metrics: {
    dailyTraffic: number;
    totalExposure: number;
    demographic: string;
    peakTime: string;
    score: number;
  };
  chartData: { label: string; value: number }[];
}

export interface ReportDataWithAnalysis {
  id: string;
  advertiser_name: string;
  station: string | null;
  line: string | null;
  location_label: string | null;
  ai_analysis: AiAnalysisResult;
  created_at: string;
  sent_at: string;
  vision_ocr_advertisers?: {
    campaign_manager_name: string | null;
    campaign_manager_email: string | null;
    contact_name: string | null;
  } | null;
  image_urls?: string[];
}

/** 차트 값이 100 초과일 수 있으므로 0~100 비율로 정규화 */
function normalizedChartValues(chartData: { label: string; value: number }[]) {
  const max = Math.max(...chartData.map((d) => d.value), 1);
  if (max <= 100) return chartData.map((d) => ({ ...d, displayValue: d.value }));
  return chartData.map((d) => ({ ...d, displayValue: Math.round((d.value / max) * 100) }));
}

export function ReportAnalysisView({
  report,
  isPreview,
}: {
  report: ReportDataWithAnalysis;
  isPreview?: boolean;
}) {
  const printRef = useRef<HTMLDivElement>(null);
  const { ai_analysis } = report;
  const formattedDate = new Date(report.created_at).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const managerName = report.vision_ocr_advertisers?.campaign_manager_name || "담당자 미지정";
  const managerEmail = report.vision_ocr_advertisers?.campaign_manager_email || "-";
  const chartDisplay = normalizedChartValues(ai_analysis.chartData);
  const peakThreshold = Math.max(...chartDisplay.map((d) => d.displayValue)) * 0.9;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20 print:bg-white print:p-0">
      <div className="sticky top-0 z-20 border-b border-indigo-100 bg-white/80 px-6 py-4 backdrop-blur-md print:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Button asChild variant="ghost" size="sm" className="-ml-2 text-slate-500 hover:text-slate-900">
              <Link href="/reports">
                <ArrowLeft className="mr-1 h-4 w-4" />
                뒤로
              </Link>
            </Button>
            <div className="h-4 w-px bg-slate-200" />
            <h1 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Bot className="h-5 w-5 text-indigo-600" />
              AI 성과 분석 리포트
            </h1>
            {isPreview ? (
              <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                미리보기
              </Badge>
            ) : (
              <Badge variant="outline" className="border-indigo-100 bg-indigo-50 text-indigo-700">
                Live
              </Badge>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
              <Download className="h-4 w-4" />
              PDF 저장
            </Button>
            <Button size="sm" className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20">
              <Share2 className="h-4 w-4" />
              공유하기
            </Button>
          </div>
        </div>
      </div>

      <main className="mx-auto mt-8 max-w-5xl px-6 print:mt-0 print:max-w-none print:px-8" ref={printRef}>
        <div className="mb-10 text-center">
          <Badge className="mb-4 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1 text-sm">
            AdMate Vision AI Analysis
          </Badge>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-3">
            광고 성과 & 인사이트 리포트
          </h1>
          <p className="text-lg text-slate-500">
            {report.advertiser_name} | {formattedDate} 발행
          </p>
          {(ai_analysis as any).debug_error && (
            <div className="mx-auto mt-4 max-w-2xl rounded-md bg-red-50 p-4 text-left border border-red-200">
              <h3 className="text-sm font-medium text-red-800">Debug Error (이미지 업로드 실패 원인)</h3>
              <pre className="mt-1 whitespace-pre-wrap text-xs text-red-700 font-mono">
                {JSON.stringify((ai_analysis as any).debug_error, null, 2)}
              </pre>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="border-indigo-100 bg-indigo-50/50 shadow-none">
            <CardHeader className="pb-2">
              <CardDescription className="text-indigo-600 font-medium">총 노출 추정 (Impressions)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-indigo-700">
                {(ai_analysis.metrics.totalExposure / 10000).toFixed(1)}만
                <span className="text-lg font-medium text-indigo-500 ml-1">명</span>
              </div>
              <p className="text-xs text-indigo-400 mt-1">AI 추정 데이터</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> 게재 위치
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-800">{report.station || "미인식"}</div>
              <p className="text-sm text-slate-500 truncate">{report.line || "미인식"}</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" /> 분석 일자
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-800">{formattedDate}</div>
              <p className="text-sm text-slate-500">발행일 기준</p>
            </CardContent>
          </Card>

          <Card className="border-slate-100 shadow-sm">
            <CardHeader className="pb-2">
              <CardDescription className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> 주 타겟층
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-slate-800 truncate" title={ai_analysis.metrics.demographic}>
                {ai_analysis.metrics.demographic.split(" ")[0]}...
              </div>
              <p className="text-sm text-slate-500 truncate" title={ai_analysis.metrics.demographic}>
                {ai_analysis.metrics.demographic}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <Card className="overflow-hidden border-indigo-200 bg-white shadow-lg shadow-indigo-100/50">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
              <CardHeader className="bg-gradient-to-br from-indigo-50/80 to-white pb-6 border-b border-indigo-50">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-indigo-100 text-indigo-600">
                    <Bot className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-lg text-indigo-900">AdMate AI Vision 분석</CardTitle>
                </div>
                <CardDescription className="text-slate-600">
                  서울교통공사 유동인구 데이터와 현장 촬영 이미지를 결합하여 분석한 결과입니다.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                  <div className="flex gap-4">
                    <Quote className="h-8 w-8 text-indigo-200 shrink-0 -mt-1" />
                    <p className="text-lg font-medium text-slate-800 m-0">{ai_analysis.analysisText}</p>
                  </div>
                </div>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                    #AI분석
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                    #{report.station}
                  </Badge>
                  <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">
                    #{report.line}
                  </Badge>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100">
                    #HighConfidence
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <Card className="border-slate-100 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-slate-400" />
                  시간대별 유동인구 추이 (Avg.)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 mt-4 flex items-end justify-between gap-2 sm:gap-4 px-2">
                  {chartDisplay.map((item, i) => {
                    const isPeak = item.displayValue >= peakThreshold;
                    return (
                      <div key={i} className="flex flex-col items-center gap-2 w-full group">
                        <div className="relative w-full flex items-end justify-center h-48">
                          <div
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 group-hover:opacity-90 ${isPeak ? "bg-indigo-500 shadow-md shadow-indigo-200" : "bg-slate-200"}`}
                            style={{ height: `${item.displayValue}%` }}
                          >
                            {isPeak && (
                              <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] py-1 px-2 rounded-full font-bold shadow-sm whitespace-nowrap">
                                Peak!
                              </div>
                            )}
                          </div>
                        </div>
                        <span className={`text-xs ${isPeak ? "font-bold text-indigo-600" : "text-slate-400"}`}>
                          {item.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-slate-500 mt-6 bg-slate-50 py-2 rounded">
                  * 데이터 출처: 서울교통공사 역별 시간대별 승하차 인원 정보 (2025.12 기준)
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white border-slate-800">
              <CardHeader>
                <CardTitle className="text-base text-slate-200">AdMate Score</CardTitle>
                <CardDescription className="text-slate-400">종합 게재 만족도</CardDescription>
              </CardHeader>
              <CardContent className="flex items-center justify-between gap-8 pb-8">
                <div className="text-left">
                  <div className="text-4xl font-bold mb-1">{ai_analysis.metrics.score}</div>
                  <div className="text-sm text-indigo-400 mb-4">Excellent</div>
                  <p className="text-sm text-slate-300">
                    유동인구 대비 노출 효율이 상위 {Math.max(0, 100 - ai_analysis.metrics.score)}%에 해당하는 우수한
                    스팟입니다.
                  </p>
                </div>
                <div className="relative inline-flex items-center justify-center shrink-0">
                  <svg className="h-28 w-28 -rotate-90 transform">
                    <circle
                      className="text-slate-700"
                      strokeWidth="8"
                      stroke="currentColor"
                      fill="transparent"
                      r="52"
                      cx="56"
                      cy="56"
                    />
                    <circle
                      className="text-indigo-500"
                      strokeWidth="8"
                      strokeDasharray={52 * 2 * Math.PI}
                      strokeDashoffset={52 * 2 * Math.PI * (1 - ai_analysis.metrics.score / 100)}
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="transparent"
                      r="52"
                      cx="56"
                      cy="56"
                    />
                  </svg>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <Card className="border-slate-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-slate-400" />
                현장 촬영 증빙
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(() => {
                const displayImages = (report.image_urls && report.image_urls.length > 0)
                  ? report.image_urls
                  : (ai_analysis as any).image_urls as string[] | undefined;

                return (
                  <div className={`grid gap-4 ${(!displayImages || displayImages.length <= 1) ? 'grid-cols-1' :
                    displayImages.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
                      displayImages.length === 3 ? 'grid-cols-1 md:grid-cols-2' :
                        'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                    }`}>
                    {(displayImages && displayImages.length > 0) ? (
                      displayImages.map((url, idx) => (
                        <div
                          key={idx}
                          className={`group relative aspect-video overflow-hidden rounded-lg bg-slate-100 border border-slate-200 ${displayImages.length === 3 && idx === 0 ? 'md:row-span-2 md:h-full' : ''
                            }`}
                        >
                          <img
                            src={url}
                            alt={`현장 촬영 이미지 ${idx + 1}`}
                            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />
                          <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-3">
                            <p className="text-xs font-medium text-white flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {idx === 0 ? "메인 촬영" : `상세 이미지 ${idx}`}
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="flex h-40 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                        이미지가 없습니다.
                      </div>
                    )}
                  </div>
                );
              })()}
              <p className="text-xs text-slate-400 mt-3 text-right">
                * 상세 원본 이미지는 함께 송부된 첨부파일을 확인해 주세요.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 border-t border-slate-200 py-10 text-center text-sm text-slate-500 bg-slate-50 -mx-6 px-6 print:bg-white">
          <p className="mb-6 leading-relaxed max-w-2xl mx-auto text-slate-400 text-xs break-keep">
            ※ 본 노출량은 서울교통공사 등 공공데이터의 역별 승·하차 인구를 기반으로 한 추정치이며, 실제 광고 노출
            수와는 차이가 있을 수 있습니다.
          </p>
          <div className="flex flex-col items-center justify-center gap-1 mb-6">
            <h4 className="font-bold text-slate-900">{managerName}</h4>
            <p>{managerEmail}</p>
          </div>
          <p>© 2026 Kt Nasmedia AdMate Vision. AI-Powered Advertisement Analysis System.</p>
        </div>
      </main>
    </div>
  );
}
