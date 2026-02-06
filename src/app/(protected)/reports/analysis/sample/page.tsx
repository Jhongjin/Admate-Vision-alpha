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
    Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

// Mock Data for "Coupang Eats" at "Gangnam Station"
const MOCK_DATA = {
    reportId: "RPT-20260206-001",
    createdAt: "2026. 02. 06",
    advertiser: {
        name: "쿠팡이츠 (Coupang Eats)",
        category: "배달 플랫폼 / F&B",
        logoParams: "bg-blue-50 text-blue-600",
    },
    location: {
        station: "강남역",
        line: "2호선 · 신분당선",
        spot: "2번 출구 메인 통로 Digital Signage A-04",
    },
    period: {
        start: "2026. 01. 30",
        end: "2026. 02. 05",
        days: 6,
    },
    metrics: {
        dailyTraffic: 145200, // 일평균 유동인구
        totalExposure: 871200, // 총 예상 노출
        demographic: "2030 직장인 및 대학생",
        peakTime: "18:00 - 20:00 (퇴근 시간대)",
    },
    aiAnalysis: `강남역 2번 출구는 테헤란로와 강남대로가 교차하는 핵심 상권으로, 배달 앱 주 사용층인 2030 직장인과 대학생 유동인구가 전체의 65% 이상을 차지합니다.

특히 퇴근 시간대(18시~20시)에 유동인구가 폭발적으로 증가하는 패턴을 보이며, 이 시간대는 저녁 배달 주문 수요가 발생하는 'Golden Hour'와 정확히 일치합니다.

지난 6일간의 게재를 통해 약 87만 명에게 브랜드가 노출된 것으로 추정되며, 단순 인지뿐만 아니라 즉각적인 앱 실행 및 주문 전환 가능성이 매우 높은 "고효율 스팟"으로 분석됩니다.`,
    chartData: [
        { label: "08시", value: 65 },
        { label: "10시", value: 40 },
        { label: "12시", value: 75 },
        { label: "14시", value: 45 },
        { label: "16시", value: 55 },
        { label: "18시", value: 100 }, // Peak
        { label: "20시", value: 85 },
        { label: "22시", value: 60 },
    ]
};

export default function AnalysisSamplePage() {
    const printRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-50/50 pb-20 print:bg-white print:p-0">
            {/* Header (Hide on Print) */}
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
                        <Badge variant="outline" className="border-indigo-100 bg-indigo-50 text-indigo-700">
                            Preview
                        </Badge>
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

            {/* Main Report Content */}
            <main className="mx-auto mt-8 max-w-5xl px-6 print:mt-0 print:max-w-none print:px-8" ref={printRef}>

                {/* Report Title Section */}
                <div className="mb-10 text-center">
                    <Badge className="mb-4 bg-slate-900 text-white hover:bg-slate-800 px-3 py-1 text-sm">AdMate Vision AI Analysis</Badge>
                    <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-3">
                        광고 성과 & 인사이트 리포트
                    </h1>
                    <p className="text-lg text-slate-500">
                        {MOCK_DATA.advertiser.name} | {MOCK_DATA.createdAt} 발행
                    </p>
                </div>

                {/* 1. Overview Cards */}
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <Card className="border-indigo-100 bg-indigo-50/50 shadow-none">
                        <CardHeader className="pb-2">
                            <CardDescription className="text-indigo-600 font-medium">총 노출 추정 (Impressions)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-indigo-700">87.1만<span className="text-lg font-medium text-indigo-500 ml-1">명</span></div>
                            <p className="text-xs text-indigo-400 mt-1">+12.5% vs 평균 대비</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> 게재 위치</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-800">{MOCK_DATA.location.station}</div>
                            <p className="text-sm text-slate-500 truncate">{MOCK_DATA.location.spot}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" /> 게재 기간</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-800">{MOCK_DATA.period.days}일간</div>
                            <p className="text-sm text-slate-500">{MOCK_DATA.period.start} ~ {MOCK_DATA.period.end}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-slate-100 shadow-sm">
                        <CardHeader className="pb-2">
                            <CardDescription className="flex items-center gap-1"><Users className="h-3.5 w-3.5" /> 주 타겟층</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="text-xl font-bold text-slate-800">2030 직장인</div>
                            <p className="text-sm text-slate-500">출퇴근 시간대 집중</p>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-8 lg:grid-cols-3">

                    {/* Left Column: AI Analysis */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* AI Insight Card */}
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
                                        <p className="text-lg font-medium text-slate-800 m-0">
                                            {MOCK_DATA.aiAnalysis}
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 flex flex-wrap gap-2">
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">#강남역유동인구</Badge>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">#2030타겟팅</Badge>
                                    <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-200">#GoldenHour</Badge>
                                    <Badge variant="secondary" className="bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100">#효율매우높음</Badge>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Simple Bar Chart Section */}
                        <Card className="border-slate-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-slate-400" />
                                    시간대별 유동인구 추이 (Avg.)
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-64 mt-4 flex items-end justify-between gap-2 sm:gap-4 px-2">
                                    {MOCK_DATA.chartData.map((item, i) => {
                                        const isPeak = item.value === 100;
                                        return (
                                            <div key={i} className="flex flex-col items-center gap-2 w-full group">
                                                <div className="relative w-full flex items-end justify-center h-48">
                                                    <div
                                                        className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 group-hover:opacity-90 ${isPeak ? 'bg-indigo-500 shadow-md shadow-indigo-200' : 'bg-slate-200'}`}
                                                        style={{ height: `${item.value}%` }}
                                                    >
                                                        {isPeak && (
                                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] py-1 px-2 rounded-full font-bold shadow-sm whitespace-nowrap">
                                                                Peak!
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className={`text-xs ${isPeak ? 'font-bold text-indigo-600' : 'text-slate-400'}`}>
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
                    </div>

                    {/* Right Column: Visual Proof */}
                    <div className="space-y-6">
                        <Card className="border-slate-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-slate-400" />
                                    현장 촬영 증빙
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="grid gap-3">
                                    <div className="group relative aspect-video overflow-hidden rounded-lg bg-slate-100 border border-slate-200">
                                        {/* Placeholder for actual image */}
                                        <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-100">
                                            <img
                                                src="https://images.unsplash.com/photo-1542289196-8575a6f87452?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80"
                                                alt="Subway Ad"
                                                className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/60 to-transparent p-3">
                                            <p className="text-xs font-medium text-white flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> 강남역 지하 1층 B구역
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="aspect-square rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                                            <img src="https://images.unsplash.com/photo-1565514020176-ade3ef4a1850?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                        </div>
                                        <div className="aspect-square rounded-lg bg-slate-100 border border-slate-200 overflow-hidden">
                                            <img src="https://images.unsplash.com/photo-1517153295259-38e3b55010a0?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80" className="h-full w-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-slate-900 text-white border-slate-800">
                            <CardHeader>
                                <CardTitle className="text-base text-slate-200">AdMate Score</CardTitle>
                                <CardDescription className="text-slate-400">종합 게재 만족도</CardDescription>
                            </CardHeader>
                            <CardContent className="text-center pb-8">
                                <div className="relative inline-flex items-center justify-center">
                                    <svg className="h-32 w-32 -rotate-90 transform">
                                        <circle
                                            className="text-slate-700"
                                            strokeWidth="8"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="58"
                                            cx="64"
                                            cy="64"
                                        />
                                        <circle
                                            className="text-indigo-500"
                                            strokeWidth="8"
                                            strokeDasharray={58 * 2 * Math.PI}
                                            strokeDashoffset={58 * 2 * Math.PI * (1 - 0.94)}
                                            strokeLinecap="round"
                                            stroke="currentColor"
                                            fill="transparent"
                                            r="58"
                                            cx="64"
                                            cy="64"
                                        />
                                    </svg>
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                                        <span className="text-3xl font-bold">94</span>
                                        <span className="block text-xs text-slate-400">Excellent</span>
                                    </div>
                                </div>
                                <p className="mt-4 text-sm text-slate-300 px-2">
                                    유동인구 대비 노출 효율이 상위 5%에 해당하는 우수한 스팟입니다.
                                </p>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Footer */}
                <div className="mt-16 border-t border-slate-200 py-8 text-center text-sm text-slate-400">
                    <p>© 2026 AdMate Vision. AI-Powered Advertisement Analysis System.</p>
                </div>
            </main>
        </div>
    );
}
