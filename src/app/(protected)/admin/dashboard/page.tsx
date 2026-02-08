"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from "recharts";
import { Activity, Tv, Eye, FileCheck, Sparkles, RefreshCw, Smartphone, MapPin, LayoutGrid, Bell, Images } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Mock Data (Korean Context)
const data = [
  { name: '월', value: 4200 },
  { name: '화', value: 3800 },
  { name: '수', value: 3500 },
  { name: '목', value: 4100 },
  { name: '금', value: 5200 },
  { name: '토', value: 6800 },
  { name: '일', value: 5900 },
];

const recentLogs = [
  { id: 1, location: "강남역 11번 출구 스크린 A", time: "14:02", status: "Verified", vehicle: "버스 140번" },
  { id: 2, location: "홍대입구역 9번 출구", time: "13:45", status: "Verified", vehicle: "택시 3829" },
  { id: 3, location: "여의도 환승센터", time: "13:30", status: "Pending", vehicle: "지하철 스크린도어" },
  { id: 4, location: "삼성 코엑스 몰", time: "13:15", status: "Verified", vehicle: "디지털 빌보드" },
];

export default function AnalyticsPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-8 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
            AdMate Vision AI 분석 대시보드
          </h1>
          <p className="text-neutral-400 mt-1">실시간 옥외광고(OOH) 성과 및 현황 모니터링</p>
        </div>
        <div className="flex gap-3">
          <Button asChild variant="ghost" className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-neutral-700">
            <Link href="/admin/gallery">
              <Images className="mr-2 h-4 w-4" />
              스마트 갤러리
            </Link>
          </Button>
          <Button asChild variant="ghost" className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-neutral-700">
            <Link href="/admin/notifications">
              <Bell className="mr-2 h-4 w-4" />
              알림 센터
            </Link>
          </Button>
          <Button asChild variant="ghost" className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-neutral-700">
            <Link href="/dashboard">
              <RefreshCw className="mr-2 h-4 w-4" />
              사용자 대시보드
            </Link>
          </Button>
          <Button className="bg-gradient-to-r from-violet-600 to-pink-600 hover:from-violet-700 hover:to-pink-700 text-white border-0">
            <Sparkles className="mr-2 h-4 w-4" />
            AI 분석 실행
          </Button>
        </div>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard 
          title="총 노출 수" 
          value="120만" 
          change="+12.5%" 
          icon={<Eye className="h-5 w-5 text-blue-400" />}
          gradient="from-blue-500/10 to-blue-500/5"
        />
        <MetricCard 
          title="관리 지점" 
          value="45개소" 
          change="+3개소 추가" 
          icon={<MapPin className="h-5 w-5 text-violet-400" />}
          gradient="from-violet-500/10 to-violet-500/5"
        />
        <MetricCard 
          title="AI 인식률" 
          value="98.5%" 
          change="+0.2%" 
          icon={<Smartphone className="h-5 w-5 text-pink-400" />}
          gradient="from-pink-500/10 to-pink-500/5"
        />
        <MetricCard 
          title="슬롯 점유율" 
          value="85%" 
          change="잔여 15%" 
          icon={<LayoutGrid className="h-5 w-5 text-amber-400" />}
          gradient="from-amber-500/10 to-amber-500/5"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="text-white">일일 광고 노출 현황</CardTitle>
              <CardDescription className="text-neutral-400">
                최근 7일간 검증된 광고 노출 수 추이
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      stroke="#888" 
                      tickLine={false} 
                      axisLine={false} 
                    />
                    <YAxis 
                      stroke="#888" 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`} 
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#171717', border: '1px solid #333', color: '#fff' }}
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    />
                    <Bar 
                      dataKey="value" 
                      fill="url(#colorGradient)" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <defs>
                      <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#ec4899" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* AI Insight Box */}
          <Card className="bg-neutral-900 border-violet-500/30 border shadow-[0_0_15px_rgba(139,92,246,0.1)]">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-violet-400 animate-pulse" />
                <CardTitle className="text-lg text-white">AI 일일 인사이트</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-neutral-200">
                <p>오늘의 데이터 분석 결과:</p>
                <ul className="list-disc list-inside space-y-1 text-sm text-neutral-400 ml-1">
                  <li>광고 노출 효율이 <strong>14:00 - 16:00</strong> 시간대에 가장 높습니다.</li>
                  <li><strong>강남역 스크린 A</strong>의 유동인구가 평소보다 15% 증가했습니다.</li>
                  <li>이상 감지: <strong>홍대입구역 9번 출구</strong> 스크린의 밝기가 기준치보다 낮게 측정되었습니다.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Sidebar (1/3 width) */}
        <div className="space-y-6">
          <Card className="bg-neutral-900 border-neutral-800 h-full">
            <CardHeader>
              <CardTitle className="text-white text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-neutral-400" />
                최근 활동 로그
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentLogs.map((log) => (
                <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-neutral-800/50 transition-colors border border-transparent hover:border-neutral-800">
                  <div className={`mt-1 h-2 w-2 rounded-full ${log.status === 'Verified' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-yellow-500'}`} />
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium text-white">{log.location}</p>
                    <div className="flex justify-between items-center text-xs text-neutral-400">
                      <span>{log.vehicle}</span>
                      <span className="font-mono">{log.time}</span>
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="ghost" className="w-full text-xs text-neutral-500 hover:text-neutral-300">
                전체 활동 보기
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, change, icon, gradient }: { title: string, value: string, change: string, icon: any, gradient: string }) {
  return (
    <Card className={`bg-neutral-900 border-neutral-800 overflow-hidden relative group`}>
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-50 group-hover:opacity-100 transition-opacity duration-500`} />
      <CardContent className="p-6 relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div className="p-2 bg-neutral-800 rounded-lg border border-neutral-700">
            {icon}
          </div>
          <Badge variant="secondary" className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700">
            {change}
          </Badge>
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-neutral-400">{title}</h3>
          <div className="text-2xl font-bold text-white">{value}</div>
        </div>
      </CardContent>
    </Card>
  )
}
