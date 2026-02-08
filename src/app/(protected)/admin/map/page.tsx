"use client";

import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowLeft, Map } from "lucide-react";

const SmartMap = dynamic(() => import("@/features/admin/components/smart-map"), {
  ssr: false,
  loading: () => <div className="w-full h-[600px] bg-neutral-900 animate-pulse rounded-xl flex items-center justify-center text-neutral-500 border border-neutral-800">지도를 불러오는 중...</div>
});

export default function MapPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Header */}
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
            실시간 광고 맵
          </h1>
          <p className="text-neutral-400 mt-1">지역별 광고 노출 현황 및 이상 징후 실시간 모니터링</p>
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

     <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-1 shadow-2xl">
      <SmartMap />
     </div>
    </div>
  )
}
