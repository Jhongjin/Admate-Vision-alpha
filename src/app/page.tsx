"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { BRAND } from "@/constants/brand";
import { getRegisteredEmail } from "@/lib/registered-email";

const features = [
  { label: "옥외 광고 촬영", desc: "스마트폰으로 촬영 후 즉시 OCR" },
  { label: "광고주 자동 인식", desc: "AI·Google Vision으로 정확한 매칭" },
  { label: "보고 자동화", desc: "위치·광고주 정보로 보고 한 번에" },
];

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const stored = getRegisteredEmail();
    if (stored) router.replace("/capture");
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <PublicHeader />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-slate-50 to-white px-4 py-20 sm:py-28">
          <div className="container mx-auto max-w-4xl text-center">
            <p className="mb-4 text-sm font-medium uppercase tracking-wider text-primary-600">
              {BRAND.visionTagline}
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
              옥외 광고 게재,
              <br />
              <span className="text-primary-600">한 번에 완성하다</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
              Meta, Google 등 복잡한 광고 정책처럼, 옥외 광고 현황 보고도 이제 AdMate가
              가장 확실한 해답을 제시합니다. 촬영부터 광고주 인식·보고까지.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button asChild size="lg" className="gap-2">
                <Link href="/login">
                  <LogIn className="h-5 w-5" />
                  Sign In
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="gap-2">
                <Link href="/signup">
                  <UserPlus className="h-5 w-5" />
                  Sign Up
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-slate-200 bg-white px-4 py-16">
          <div className="container mx-auto max-w-4xl">
            <h2 className="text-center text-2xl font-semibold text-slate-900">
              Experience the Future of Ad Compliance
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-center text-slate-600">
              옥외 광고 게재 현황 보고를 한 번에.
            </p>
            <ul className="mt-12 grid gap-8 sm:grid-cols-3">
              {features.map(({ label, desc }) => (
                <li
                  key={label}
                  className="flex flex-col items-center rounded-xl border border-slate-200 bg-slate-50/50 p-6 text-center"
                >
                  <CheckCircle2 className="h-10 w-10 text-primary-500" />
                  <h3 className="mt-4 font-semibold text-slate-900">{label}</h3>
                  <p className="mt-2 text-sm text-slate-600">{desc}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="px-4 py-16">
          <div className="container mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-slate-50/50 p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-900">
              Ready to streamline your ad operations?
            </h2>
            <p className="mt-2 text-slate-600">
              회원가입 시 이름·이메일만 입력하면 됩니다. DB에 저장되어 다음 방문 시
              로그인으로 이용할 수 있습니다.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild>
                <Link href="/signup">Start Now</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
