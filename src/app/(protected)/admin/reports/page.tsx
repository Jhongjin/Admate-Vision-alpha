"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ArrowLeft, 
  FileText, 
  Calendar, 
  Download, 
  Loader2, 
  Sparkles,
  BarChart,
  Users,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

export default function ReportsPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedReport, setGeneratedReport] = useState<any>(null);

  // Form State
  const [reportType, setReportType] = useState("monthly");
  const [advertiser, setAdvertiser] = useState("all");

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(10);
    setGeneratedReport(null);

    // Simulate AI Generation Process
    const steps = [
      { p: 30, task: "데이터 수집 중..." },
      { p: 50, task: "광고 노출 성과 분석 중..." },
      { p: 70, task: "지역별 효율 계산 중..." },
      { p: 90, task: "AI 요약 및 리포트 작성 중..." },
      { p: 100, task: "완료!" }
    ];

    for (const step of steps) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setProgress(step.p);
    }

    // Mock Report Data
    const reportData = {
      id: `RPT-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toLocaleDateString(),
      type: reportType === "monthly" ? "월간 성과 보고서" : "주간 요약 보고서",
      advertiser: advertiser === "all" ? "전체 광고주" : "선택된 광고주",
      summary: "이번 달은 전월 대비 광고 노출이 15% 증가했습니다. 특히 강남구와 서초구에서의 성과가 두드러지며, 퇴근 시간대(18:00-20:00)의 효율이 가장 높게 나타났습니다. 옥외광고 특성 상 날씨가 맑은 날의 인식률이 99%로 매우 안정적입니다.",
      stats: {
        impressions: "1,240,500",
        locations: "45",
        efficiency: "+12.5%",
        topLocation: "강남역 11번 출구"
      }
    };

    setGeneratedReport(reportData);
    setIsGenerating(false);
    toast({
      title: "리포트 생성 완료",
      description: "AI 기반 성과 분석 리포트가 준비되었습니다.",
    });
  };

  const downloadPDF = async () => {
    const element = document.getElementById("report-preview");
    if (!element) return;

    try {
      toast({ description: "PDF 다운로드 중..." });
      
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: "#ffffff", // PDF should be white bg for printing usually
        ignoreElements: (node) => node.id === "download-actions"
      });
      
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`AdMate_Report_${generatedReport?.id}.pdf`);
      
      toast({ 
        title: "다운로드 완료", 
        description: "PDF 파일이 성공적으로 저장되었습니다." 
      });
    } catch (err) {
      console.error(err);
      toast({ 
        title: "오류 발생", 
        description: "PDF 생성 중 문제가 발생했습니다.", 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
            비즈니스 리포트 센터
          </h1>
          <p className="text-neutral-400 mt-1">AI 자동 분석 기반 성과 보고서 생성 및 관리</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="ghost" className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-neutral-700">
            <Link href="/admin/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              대시보드 복귀
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Configuration */}
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-violet-400" />
                리포트 설정
              </CardTitle>
              <CardDescription className="text-neutral-400">
                원하는 조건으로 AI 분석을 시작하세요.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-white">리포트 종류</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger id="type" className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="종류 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectItem value="monthly">월간 성과 보고서</SelectItem>
                    <SelectItem value="weekly">주간 요약 보고서</SelectItem>
                    <SelectItem value="campaign">캠페인별 상세 분석</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="advertiser" className="text-white">광고주 / 캠페인</Label>
                <Select value={advertiser} onValueChange={setAdvertiser}>
                  <SelectTrigger id="advertiser" className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectValue placeholder="광고주 선택" />
                  </SelectTrigger>
                  <SelectContent className="bg-neutral-800 border-neutral-700 text-white">
                    <SelectItem value="all">전체 광고주</SelectItem>
                    <SelectItem value="nike">나이키 (Nike)</SelectItem>
                    <SelectItem value="samsung">삼성전자 (Samsung)</SelectItem>
                    <SelectItem value="starbucks">스타벅스 (Starbucks)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4">
                <Button 
                  className="w-full bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:from-violet-700 hover:to-pink-700 border-0"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      AI 분석 중... {progress}%
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI 리포트 생성
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-neutral-900 border-neutral-800">
             <CardHeader>
               <CardTitle className="text-white text-base">생성 기록</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="space-y-3">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="flex items-center gap-3 text-sm p-2 rounded hover:bg-neutral-800/50 cursor-pointer transition-colors">
                     <FileText className="h-4 w-4 text-neutral-500" />
                     <div className="flex-1">
                       <p className="text-neutral-300">2024년 {i}월 월간 보고서</p>
                       <p className="text-xs text-neutral-500">2024.0{i+1}.01 생성됨</p>
                     </div>
                     <Download className="h-4 w-4 text-neutral-500 hover:text-white" />
                   </div>
                 ))}
               </div>
             </CardContent>
          </Card>
        </div>

        {/* Right: Preview */}
        <div className="lg:col-span-2">
          {generatedReport ? (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
              <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-lg border border-neutral-800" id="download-actions">
                <div className="flex items-center gap-2 text-white">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <span className="font-semibold">리포트 생성 완료</span>
                </div>
                <div className="flex gap-2">
                   <Button variant="outline" onClick={() => setGeneratedReport(null)}>
                     닫기
                   </Button>
                   <Button onClick={downloadPDF} className="bg-white text-black hover:bg-neutral-200">
                     <Download className="mr-2 h-4 w-4" />
                     PDF 다운로드
                   </Button>
                </div>
              </div>

              {/* A4 Preview Container - Needs distinct styling for PDF capture */}
              <div className="w-full bg-neutral-800/50 p-4 md:p-8 rounded-xl overflow-auto flex justify-center">
                 <div 
                   id="report-preview" 
                   className="bg-white text-black w-full max-w-[210mm] min-h-[297mm] p-[15mm] shadow-2xl relative"
                   style={{ fontFamily: 'Pretendard, sans-serif' }}
                 >
                    {/* Report Content */}
                    <div className="border-b-2 border-slate-900 pb-6 mb-8 flex justify-between items-end">
                      <div>
                        <h1 className="text-3xl font-bold text-slate-900">AdMate Vision</h1>
                        <p className="text-slate-500 text-sm mt-1">AI Automated OOH Analytics Report</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-2 text-slate-600 border-slate-300">{generatedReport.type}</Badge>
                        <p className="text-sm font-medium text-slate-700">발행일: {generatedReport.date}</p>
                        <p className="text-xs text-slate-400">ID: {generatedReport.id}</p>
                      </div>
                    </div>

                    <div className="space-y-8">
                       {/* 1. Summary */}
                       <section>
                         <h2 className="text-lg font-bold text-slate-800 border-l-4 border-indigo-500 pl-3 mb-4">
                           AI Executive Summary
                         </h2>
                         <div className="bg-slate-50 p-6 rounded-lg border border-slate-100 text-slate-700 leading-relaxed">
                           {generatedReport.summary}
                         </div>
                       </section>

                       {/* 2. Key Metrics */}
                       <section>
                         <h2 className="text-lg font-bold text-slate-800 border-l-4 border-cyan-500 pl-3 mb-4">
                           Key Performance Metrics
                         </h2>
                         <div className="grid grid-cols-2 gap-4">
                           <div className="p-4 bg-slate-50 rounded border border-slate-100">
                             <p className="text-sm text-slate-500">총 노출 수 (Impressions)</p>
                             <p className="text-2xl font-bold text-slate-900 mt-1">{generatedReport.stats.impressions}</p>
                           </div>
                           <div className="p-4 bg-slate-50 rounded border border-slate-100">
                             <p className="text-sm text-slate-500">전월 대비 효율</p>
                             <p className="text-2xl font-bold text-emerald-600 mt-1">{generatedReport.stats.efficiency}</p>
                           </div>
                           <div className="p-4 bg-slate-50 rounded border border-slate-100">
                             <p className="text-sm text-slate-500">분석 Locations</p>
                             <p className="text-2xl font-bold text-slate-900 mt-1">{generatedReport.stats.locations}개소</p>
                           </div>
                            <div className="p-4 bg-slate-50 rounded border border-slate-100">
                             <p className="text-sm text-slate-500">Top Performer</p>
                             <p className="text-xl font-bold text-indigo-600 mt-1 truncate">{generatedReport.stats.topLocation}</p>
                           </div>
                         </div>
                       </section>

                       {/* 3. Placeholder for Chart */}
                       <section>
                         <h2 className="text-lg font-bold text-slate-800 border-l-4 border-pink-500 pl-3 mb-4">
                           Trend Analysis
                         </h2>
                         <div className="h-64 bg-slate-50 rounded border border-slate-100 flex items-center justify-center text-slate-400">
                            <BarChart className="h-12 w-12 mr-2 opacity-50" />
                            <span>[Chart Visualization Area]</span>
                         </div>
                         <p className="text-xs text-slate-400 mt-2 text-center">* 상세 차트 데이터는 별도 첨부 파일을 확인하세요.</p>
                       </section>
                    </div>

                    {/* Footer */}
                    <div className="absolute bottom-[15mm] left-[15mm] right-[15mm] border-t border-slate-200 pt-4 flex justify-between text-xs text-slate-400">
                      <span>Generated by AdMate Vision AI</span>
                      <span>Confidential Document</span>
                    </div>
                 </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[500px] flex flex-col items-center justify-center border border-dashed border-neutral-800 rounded-xl bg-neutral-900/50 text-neutral-500">
               {isGenerating ? (
                 <div className="text-center space-y-4">
                    <div className="relative w-20 h-20 mx-auto">
                      <div className="absolute inset-0 border-4 border-neutral-800 rounded-full"></div>
                      <div className="absolute inset-0 border-4 border-violet-500 rounded-full border-t-transparent animate-spin"></div>
                      <Sparkles className="absolute inset-0 m-auto text-violet-400 animate-pulse" />
                    </div>
                    <p className="text-lg font-medium text-white">AI가 데이터를 분석하고 있습니다...</p>
                    <Progress value={progress} className="w-64 h-2" />
                    <p className="text-sm">{progress}% 완료</p>
                 </div>
               ) : (
                 <div className="text-center space-y-2">
                   <FileText className="h-16 w-16 mx-auto opacity-20 mb-4" />
                   <h3 className="text-xl font-semibold text-neutral-300">리포트 미리보기</h3>
                   <p className="max-w-md mx-auto">왼쪽 설정 패널에서 조건을 선택하고 'AI 리포트 생성' 버튼을 눌러주세요.</p>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
