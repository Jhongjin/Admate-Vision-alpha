"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { BRAND } from "@/constants/brand";
import { getRegisteredEmail } from "@/lib/registered-email";

const HERO_IMAGE =
  "https://picsum.photos/seed/outdoor-billboard/800/480";

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
        {/* Hero: 옥외광고 이미지 */}
        <section className="relative w-full border-b border-slate-200">
          <div className="relative aspect-[5/3] w-full overflow-hidden bg-slate-200">
            <Image
              src={HERO_IMAGE}
              alt="옥외 광고"
              fill
              className="object-cover"
              sizes="(max-width: 420px) 100vw, 420px"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
              <p className="text-xs font-medium uppercase tracking-wider text-white/90">
                {BRAND.visionTagline}
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                옥외 광고 게재,
                <br />
                한 번에 완성하다
              </h1>
            </div>
          </div>
          <div className="flex flex-col gap-3 p-4">
            <Button asChild size="lg" className="min-h-[48px] w-full gap-2">
              <Link href="/login">
                <LogIn className="h-5 w-5 shrink-0" />
                Sign In
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="min-h-[48px] w-full gap-2">
              <Link href="/signup">
                <UserPlus className="h-5 w-5 shrink-0" />
                Sign Up
              </Link>
            </Button>
          </div>
        </section>

        {/* Features */}
        <section className="border-b border-slate-200 bg-white px-4 py-6">
          <h2 className="text-center text-lg font-semibold text-slate-900">
            옥외 광고 게재 현황 보고를 한 번에
          </h2>
          <ul className="mt-6 grid gap-4">
            {features.map(({ label, desc }) => (
              <li
                key={label}
                className="flex items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4"
              >
                <CheckCircle2 className="h-8 w-8 shrink-0 text-primary-500" />
                <div>
                  <h3 className="font-semibold text-slate-900">{label}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* CTA */}
        <section className="px-4 py-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-6 text-center">
            <h2 className="text-lg font-semibold text-slate-900">
              바로 시작하기
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              회원가입 시 이름·이메일만 입력하면 됩니다.
            </p>
            <div className="mt-4 flex flex-col gap-3">
              <Button asChild size="lg" className="min-h-[48px] w-full">
                <Link href="/signup">Start Now</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="min-h-[48px] w-full">
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
