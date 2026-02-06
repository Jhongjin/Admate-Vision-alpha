"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PublicHeader } from "@/components/layout/public-header";
import { PublicFooter } from "@/components/layout/public-footer";
import { BRAND } from "@/constants/brand";
import { signupApi, extractApiErrorMessage } from "@/features/auth/api";
import { setRegisteredEmail } from "@/lib/registered-email";
import { useToast } from "@/hooks/use-toast";

const DUPLICATE_EMAIL_MESSAGE =
  "이미 가입된 이메일입니다. 로그인을 이용해 주세요.";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formState, setFormState] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateEmailMessage, setDuplicateEmailMessage] = useState<string | null>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
      setDuplicateEmailMessage(null);
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formState.name.trim() || !formState.email.trim()) return;
      setIsSubmitting(true);
      setDuplicateEmailMessage(null);
      try {
        const user = await signupApi({
          name: formState.name.trim(),
          email: formState.email.trim(),
        });
        setRegisteredEmail(user.email);
        toast({ title: "회원가입 완료", description: `${user.name}님, 환영합니다.` });
        router.replace("/capture");
      } catch (err) {
        const isDuplicate =
          isAxiosError(err) && err.response?.status === 409;
        if (isDuplicate) {
          setDuplicateEmailMessage(DUPLICATE_EMAIL_MESSAGE);
        } else {
          toast({
            title: "회원가입 실패",
            description: extractApiErrorMessage(err, "회원가입 중 오류가 발생했습니다."),
            variant: "destructive",
          });
        }
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.name, formState.email, router, toast]
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <PublicHeader />

      <main className="flex flex-1 flex-col items-center justify-center safe-area-padding-x py-8">
        <div className="container max-w-md w-full">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Sign Up
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              이름과 이메일만 입력하면 즉시 시작할 수 있습니다.
            </p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/80 p-6 shadow-xl shadow-slate-200/20 backdrop-blur-xl sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-700 font-medium">
                  이름 (필수)
                </Label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  autoComplete="name"
                  placeholder="홍길동"
                  value={formState.name}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="h-12 border-slate-200 bg-white px-4 text-base focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-medium">
                  이메일 (필수)
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="example@company.com"
                  value={formState.email}
                  onChange={handleChange}
                  required
                  disabled={isSubmitting}
                  className="h-12 border-slate-200 bg-white px-4 text-base focus-visible:ring-indigo-500"
                />
              </div>
              <Button
                type="submit"
                size="lg"
                className="h-12 w-full text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20"
                disabled={isSubmitting}
              >
                {isSubmitting ? "등록 중…" : "Sign Up"}
              </Button>
              {duplicateEmailMessage && (
                <p
                  role="alert"
                  className="mt-3 rounded-lg bg-amber-50 px-3 py-2.5 text-center text-sm font-medium text-amber-800"
                >
                  {duplicateEmailMessage}
                </p>
              )}
            </form>
            <div className="mt-6 border-t border-slate-100 pt-6 text-center text-sm text-slate-500">
              이미 계정이 있으신가요?{" "}
              <Link
                href="/login"
                className="font-semibold text-indigo-600 hover:text-indigo-700 hover:underline decoration-2 underline-offset-2"
              >
                Sign In
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
