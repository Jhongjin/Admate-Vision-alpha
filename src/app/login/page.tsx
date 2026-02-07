"use client";

import { useCallback, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { BRAND } from "@/constants/brand";
import { loginApi, extractApiErrorMessage } from "@/features/auth/api";
import { setRegisteredEmail } from "@/lib/registered-email";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const EMAIL_DOMAIN = "@nasmedia.co.kr";
  const [emailId, setEmailId] = useState("");
  const [keepLoggedIn, setKeepLoggedIn] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const verified = searchParams.get("verified");
    const error = searchParams.get("error");
    if (verified === "1") {
      toast({
        title: "이메일 인증 완료",
        description: "이제 로그인해 주세요.",
      });
      router.replace("/login", { scroll: false });
    } else if (error === "verification_failed" || error === "invalid_token") {
      toast({
        title: "인증 실패",
        description: "인증 링크가 만료되었거나 올바르지 않습니다. 다시 시도해 주세요.",
        variant: "destructive",
      });
      router.replace("/login", { scroll: false });
    }
  }, [searchParams, toast, router]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmedId = emailId.trim();
      if (!trimmedId) return;

      const fullEmail = `${trimmedId}${EMAIL_DOMAIN}`;
      setIsSubmitting(true);
      try {
        const user = await loginApi({ email: fullEmail });
        setRegisteredEmail(user.email, { keepLoggedIn });
        toast({ title: "로그인 완료", description: `${user.name}님, 환영합니다.`, duration: 2000 });
        router.replace("/capture");
      } catch (err) {
        toast({
          title: "로그인 실패",
          description: extractApiErrorMessage(err, "등록된 이메일이 없습니다. 회원가입 후 이용해 주세요."),
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [emailId, keepLoggedIn, router, toast]
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <PublicHeader />

      <main className="flex flex-1 flex-col items-center justify-center safe-area-padding-x py-8">
        <div className="container max-w-md w-full">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sign In
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              이메일 아이디를 입력하여 로그인하세요.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/80 p-6 shadow-xl shadow-slate-200/20 backdrop-blur-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="emailId" className="text-slate-700 font-medium">
                  이메일 아이디
                </Label>
                <div className="flex h-12 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-base focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-0">
                  <Input
                    id="emailId"
                    name="emailId"
                    type="text"
                    autoComplete="username"
                    placeholder="hong"
                    value={emailId}
                    onChange={(e) => setEmailId(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-auto flex-1 border-0 p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <span className="shrink-0 text-slate-500">{EMAIL_DOMAIN}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="keepLoggedIn"
                  checked={keepLoggedIn}
                  onCheckedChange={(v) => setKeepLoggedIn(v === true)}
                  className="border-slate-300 data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                />
                <Label
                  htmlFor="keepLoggedIn"
                  className="cursor-pointer text-sm font-normal text-slate-600"
                >
                  로그인 상태 유지
                </Label>
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? "로그인 중…" : "Sign In"}
              </Button>
            </form>
            <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline decoration-2 underline-offset-2"
              >
                Sign Up
              </Link>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-slate-500">
            {BRAND.name} · {BRAND.visionTagline}
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}
