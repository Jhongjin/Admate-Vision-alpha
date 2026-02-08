"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Camera, Tag, Clock, MapPin, X, ArrowUpRight, LayoutDashboard, Bell, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// Mock Data for Gallery
const galleryItems = [
  {
    id: 1,
    url: "https://images.unsplash.com/photo-1544985337-c86ef0f3f227?q=80&w=600&auto=format&fit=crop",
    location: "강남역 11번 출구",
    time: "2024-02-08 14:30",
    tags: ["전광판", "주간", "혼잡"],
    confidence: "99.2%",
    status: "verified"
  },
  {
    id: 2,
    url: "https://images.unsplash.com/photo-1570174092758-2023cb23438e?q=80&w=600&auto=format&fit=crop",
    location: "여의도 환승센터",
    time: "2024-02-08 13:15",
    tags: ["버스 쉘터", "고정형", "맑음"],
    confidence: "98.5%",
    status: "verified"
  },
  {
    id: 3,
    url: "https://images.unsplash.com/photo-1519638831568-d9897f54ed69?q=80&w=600&auto=format&fit=crop",
    location: "홍대입구역 메인거리",
    time: "2024-02-07 22:45",
    tags: ["네온 사인", "야간", "비"],
    confidence: "94.1%",
    status: "review_needed"
  },
  {
    id: 4,
    url: "https://images.unsplash.com/photo-1494587351196-bbf560c4832d?q=80&w=600&auto=format&fit=crop",
    location: "올림픽대로",
    time: "2024-02-08 09:20",
    tags: ["야립 광고", "고속도로", "맑음"],
    confidence: "97.8%",
    status: "verified"
  },
  {
    id: 5,
    url: "https://images.unsplash.com/photo-1517260739337-6799d2eb9ce0?q=80&w=600&auto=format&fit=crop",
    location: "코엑스 몰 내부",
    time: "2024-02-08 11:05",
    tags: ["실내 LCD", "비디오", "유동인구 많음"],
    confidence: "99.9%",
    status: "verified"
  },
  {
    id: 6,
    url: "https://images.unsplash.com/photo-1557053503-0c252e5c8093?q=80&w=600&auto=format&fit=crop",
    location: "잠실 롯데타워",
    time: "2024-02-07 19:30",
    tags: ["미디어 파사드", "야간", "랜드마크"],
    confidence: "95.5%",
    status: "verified"
  }
];

const allTags = ["전체", "전광판", "버스 쉘터", "야간", "주간", "비", "실내"];

export default function GalleryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");

  // Filtering Logic
  const filteredItems = galleryItems.filter(item => {
    const matchesSearch = item.location.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesTag = selectedTag === "전체" || item.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-6 lg:p-8 space-y-6 md:space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-pink-400">
            스마트 이미지 갤러리
          </h1>
          <p className="text-neutral-400 mt-1">AI 기반 광고 이미지 검색 및 관리 시스템</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button asChild variant="ghost" className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700 hover:text-white border border-neutral-700">
            <Link href="/admin/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              대시보드 복귀
            </Link>
          </Button>
          <Button className="bg-white text-black hover:bg-neutral-200 border-0">
            <Camera className="mr-2 h-4 w-4" />
            이미지 업로드
          </Button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1 max-w-lg">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input 
              placeholder="장소, 태그, 시간으로 검색..." 
              className="pl-10 bg-neutral-900 border-neutral-800 text-white focus:ring-violet-500 focus:border-violet-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="ghost" className="text-neutral-400 hover:text-white">
            <Filter className="mr-2 h-4 w-4" />
            상세 필터
          </Button>
        </div>

        {/* Tag Filters */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {allTags.map((tag) => (
            <Badge 
              key={tag}
              onClick={() => setSelectedTag(tag)}
              variant={selectedTag === tag ? "default" : "secondary"}
              className={`cursor-pointer px-4 py-1.5 transition-all ${
                selectedTag === tag 
                  ? "bg-violet-600 hover:bg-violet-700 text-white" 
                  : "bg-neutral-900 text-neutral-400 hover:bg-neutral-800"
              }`}
            >
              {tag}
            </Badge>
          ))}
        </div>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredItems.map((item) => (
          <div key={item.id} className="group relative break-inside-avoid">
            <Card className="bg-neutral-900 border-neutral-800 overflow-hidden hover:border-violet-500/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)]">
              {/* Image Container */}
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image 
                  src={item.url} 
                  alt={item.location}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                />
                {/* Overlay Badge */}
                <div className="absolute top-3 right-3">
                  <Badge className={`backdrop-blur-md border-0 ${
                    item.status === 'verified' 
                      ? 'bg-emerald-500/80 text-white' 
                      : 'bg-yellow-500/80 text-white'
                  }`}>
                    {item.status === 'verified' ? '검증됨' : '확인 필요'}
                  </Badge>
                </div>
                {/* Confidence Score */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="flex items-center text-xs text-white/90">
                    <span className="font-semibold text-violet-300 mr-2">AI 신뢰도:</span>
                    {item.confidence}
                  </div>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Location & Time */}
                <div>
                  <h3 className="font-semibold text-white truncate flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 text-violet-400" />
                    {item.location}
                  </h3>
                  <div className="text-xs text-neutral-500 mt-1 flex items-center gap-2">
                    <Clock className="h-3 w-3" />
                    {item.time}
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag) => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700 flex items-center gap-1">
                      <Tag className="h-2.5 w-2.5 opacity-50" />
                      {tag}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {filteredItems.length === 0 && (
          <div className="col-span-full py-12 text-center text-neutral-500">
            <X className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p className="text-lg font-medium">이미지를 찾을 수 없습니다</p>
            <p className="text-sm">검색어의 철자를 확인하거나 필터를 조정해보세요.</p>
          </div>
        )}
      </div>
    </div>
  );
}
