"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, LogIn, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRegisteredEmail } from "@/lib/registered-email";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const stored = getRegisteredEmail();
    if (stored) router.replace("/capture");
  }, [router]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-secondary-50 px-4 text-gray-900">
      <header className="absolute left-0 right-0 top-0 border-b border-secondary-200 bg-white">
        <div className="container flex h-14 items-center">
          <span className="text-lg font-semibold text-primary-500">
            옥외 광고 게재 현황 자동 보고 툴
          </span>
        </div>
      </header>

      <section className="flex w-full max-w-md flex-col items-center gap-8 text-center">
        <div className="flex justify-center">
          <Mail className="h-14 w-14 text-primary-500" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            Admate-Vision
          </h1>
          <p className="text-sm text-secondary-500">
            옥외 광고 촬영·광고주 인식·보고를 한 번에.
          </p>
        </div>

        <div className="flex w-full flex-col gap-3">
          <Button asChild size="lg" className="w-full gap-2">
            <Link href="/login">
              <LogIn className="h-5 w-5" />
              로그인
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full gap-2">
            <Link href="/signup">
              <UserPlus className="h-5 w-5" />
              회원가입
            </Link>
          </Button>
        </div>

        <p className="text-xs text-secondary-500">
          회원가입 시 이름·이메일만 입력하면 됩니다. DB에 저장되어 다음 방문 시 로그인으로 이용할 수 있습니다.
        </p>
      </section>
    </main>
  );
}
