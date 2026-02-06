"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, Volume2, VolumeX, Camera, BrainCircuit, FileText, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { BRAND } from "@/constants/brand";

const features = [
  {
    icon: Camera,
    label: "Instant Capture",
    desc: "현장에서 촬영 즉시 텍스트(OCR)를 추출합니다.",
    color: "text-indigo-500",
    bg: "bg-indigo-50",
  },
  {
    icon: BrainCircuit,
    label: "AI Analysis",
    desc: "Google Vision AI가 광고주를 정확히 매칭합니다.",
    color: "text-cyan-500",
    bg: "bg-cyan-50",
  },
  {
    icon: FileText,
    label: "Auto Reporting",
    desc: "복잡한 보고서 작성, 터치 한 번으로 끝내세요.",
    color: "text-purple-500",
    bg: "bg-purple-50",
  },
];

export default function Home() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isMuted, setIsMuted] = useState(true);

  /* Auto-redirect removed as per user request to allow viewing landing page */

  const toggleMute = () => {
    if (!videoRef.current) return;
    const next = !isMuted;
    videoRef.current.muted = next;
    setIsMuted(next);
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full overflow-hidden bg-white pb-12 pt-4 lg:pt-8">
          <div className="container relative z-10 mx-auto max-w-5xl px-4">
            {/* Headlines */}
            <div className="mb-8 text-center">
              <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-slate-500 shadow-sm border border-slate-200">
                {BRAND.visionTagline}
              </span>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl md:text-5xl lg:leading-tight">
                옥외 광고의 모든 순간, <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">
                  AdMate Vision
                </span>
                으로 완성하다
              </h1>
              <p className="mt-4 text-base text-slate-600 sm:text-lg">
                촬영부터 보고까지, AI가 알아서 처리해 드립니다.
              </p>
            </div>

            {/* Video Container with Premium Frame */}
            <div className="group relative mx-auto aspect-[5/3] w-full max-w-3xl overflow-hidden rounded-2xl bg-slate-900 shadow-2xl shadow-slate-200/50 ring-1 ring-slate-900/5 transition-transform duration-700 hover:scale-[1.01]">
              <div className="absolute inset-0 z-0 bg-slate-800 animate-pulse">
                {/* Placeholder while loading */}
              </div>
              <video
                ref={videoRef}
                src="/hero.mp4"
                autoPlay
                muted={isMuted}
                loop
                playsInline
                className="absolute inset-0 h-full w-full object-cover opacity-90 mix-blend-normal transition-opacity duration-500 ease-in-out"
                aria-label="옥외 광고 시연 영상"
              />

              {/* Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-80" />

              {/* Mute Control */}
              <button
                type="button"
                onClick={toggleMute}
                className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur-md text-white transition hover:bg-white/20 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label={isMuted ? "소리 켜기" : "소리 끄기"}
              >
                {isMuted ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              {/* Video Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-6 text-white sm:p-8">
                <p className="text-sm font-medium text-indigo-300">Automated Workflow</p>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-1 w-12 rounded-full bg-indigo-500" />
                  <p className="font-semibold tracking-wide">AI가 분석 중입니다...</p>
                </div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Button asChild size="lg" className="h-12 w-full min-w-[160px] rounded-full bg-indigo-600 text-base font-semibold shadow-lg shadow-indigo-500/25 transition-all hover:bg-indigo-700 hover:shadow-indigo-500/40 sm:w-auto">
                <Link href="/login">
                  <LogIn className="mr-2 h-5 w-5" />
                  시작하기
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 w-full min-w-[160px] rounded-full border-slate-200 bg-white text-base font-semibold text-slate-700 hover:bg-slate-50 hover:text-slate-900 sm:w-auto">
                <Link href="/signup">
                  <UserPlus className="mr-2 h-5 w-5" />
                  회원가입
                </Link>
              </Button>
            </div>
          </div>

          {/* Background Decorative */}
          <div className="absolute top-0 -z-10 h-full w-full bg-white">
            <div className="absolute right-0 top-0 h-[500px] w-[500px] -translate-y-[20%] translate-x-[20%] rounded-full bg-indigo-50/50 blur-3xl" />
            <div className="absolute left-0 top-[20%] h-[300px] w-[300px] -translate-x-[20%] rounded-full bg-cyan-50/50 blur-3xl" />
          </div>
        </section>

        {/* Features Section (Glassmorphism) */}
        <section className="relative overflow-hidden border-t border-slate-200 bg-slate-50/50 py-16 lg:py-24">
          <div className="container relative z-10 mx-auto px-4">
            <div className="mb-12 text-center">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 sm:text-3xl">
                왜 AdMate Vision인가요?
              </h2>
              <p className="mt-3 text-slate-500">
                복잡한 과정은 줄이고, 효율은 극대화했습니다.
              </p>
            </div>

            <div className="grid gap-6 sm:grid-cols-3">
              {features.map(({ icon: Icon, label, desc, color, bg }) => (
                <div
                  key={label}
                  className="group relative overflow-hidden rounded-2xl border border-white/50 bg-white/70 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-indigo-100 hover:bg-white hover:shadow-2xl hover:shadow-indigo-100/50"
                >
                  <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl ${bg} ${color} ring-1 ring-black/5 transition-transform group-hover:scale-110`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {label}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">
                    {desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="relative py-20">
          <div className="container mx-auto max-w-4xl px-4 text-center">
            <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-900 px-6 py-12 shadow-2xl shadow-indigo-900/20 sm:px-12">
              <h2 className="text-2xl font-bold text-white sm:text-3xl">
                지금 바로 시작하세요
              </h2>
              <p className="mt-4 text-indigo-200">
                복잡한 절차 없이 이름과 이메일만으로 3초 만에 가입 가능합니다.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button asChild size="lg" className="h-14 w-full rounded-full bg-white text-lg font-bold text-indigo-900 hover:bg-indigo-50 sm:w-auto px-8">
                  <Link href="/signup">
                    무료로 시작하기 <ChevronRight className="ml-1 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
