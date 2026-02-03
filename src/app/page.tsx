"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRegisteredEmail, setRegisteredEmail } from "@/lib/registered-email";

export default function Home() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = getRegisteredEmail();
    if (stored) router.replace("/capture");
  }, [router]);

  const handleSubmit = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      const trimmed = email.trim();
      if (!trimmed) {
        setError("이메일을 입력하세요.");
        return;
      }
      const simpleEmailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!simpleEmailRegex.test(trimmed)) {
        setError("올바른 이메일 형식이 아닙니다.");
        return;
      }
      setIsSubmitting(true);
      setRegisteredEmail(trimmed);
      router.push("/capture");
    },
    [email, router]
  );

  return (
    <main className="min-h-screen bg-secondary-50 text-gray-900 flex flex-col items-center justify-center px-4">
      <header className="absolute top-0 left-0 right-0 border-b border-secondary-200 bg-white">
        <div className="container flex h-14 items-center">
          <span className="text-lg font-semibold text-primary-500">
            옥외 광고 게재 현황 자동 보고 툴
          </span>
        </div>
      </header>

      <section className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-primary-500" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          이메일 등록
        </h1>
        <p className="text-sm text-secondary-500">
          최초 1회만 등록하시면 됩니다. 이메일은 이 기기(브라우저)에만 저장됩니다.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          <label className="flex flex-col gap-2 text-sm font-medium text-gray-700">
            이메일
            <input
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="example@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              className="rounded-md border border-secondary-200 bg-white px-3 py-2 text-base text-gray-900 placeholder:text-secondary-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
            />
          </label>
          {error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : null}
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "이동 중..." : "등록하고 카메라 열기"}
          </Button>
        </form>

        <p className="text-xs text-secondary-500">
          등록된 이메일은 쿠키·브라우저 저장소에 저장되며, 다음 방문 시 바로 촬영 화면으로 이동합니다.
        </p>
      </section>
    </main>
  );
}
