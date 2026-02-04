"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const trimmed = email.trim();
      if (!trimmed) return;
      setIsSubmitting(true);
      try {
        const user = await loginApi({ email: trimmed });
        setRegisteredEmail(user.email);
        toast({ title: "로그인 완료", description: `${user.name}님, 환영합니다.` });
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
    [email, router, toast]
  );

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <PublicHeader />

      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign In
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              가입한 이메일로 로그인하세요.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700">
                  이메일
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="border-slate-200 bg-white"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting}
              >
                {isSubmitting ? "로그인 중…" : "Sign In"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-500">
              계정이 없으신가요?{" "}
              <Link
                href="/signup"
                className="font-medium text-primary-600 hover:text-primary-700 hover:underline"
              >
                Sign Up
              </Link>
            </p>
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
