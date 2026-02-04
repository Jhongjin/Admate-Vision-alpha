"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signupApi, extractApiErrorMessage } from "@/features/auth/api";
import { setRegisteredEmail } from "@/lib/registered-email";
import { useToast } from "@/hooks/use-toast";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [formState, setFormState] = useState({ name: "", email: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!formState.name.trim() || !formState.email.trim()) return;
      setIsSubmitting(true);
      try {
        const user = await signupApi({
          name: formState.name.trim(),
          email: formState.email.trim(),
        });
        setRegisteredEmail(user.email);
        toast({ title: "회원가입 완료", description: `${user.name}님, 환영합니다.` });
        router.replace("/capture");
      } catch (err) {
        toast({
          title: "회원가입 실패",
          description: extractApiErrorMessage(err, "회원가입 중 오류가 발생했습니다."),
          variant: "destructive",
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.name, formState.email, router, toast]
  );

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-gray-900">회원가입</h1>
        <p className="text-secondary-500">
          이름과 이메일만 입력하면 됩니다. DB에 저장되어 다음에도 사용할 수 있습니다.
        </p>
      </header>
      <div className="grid w-full gap-8 md:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-secondary-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="name">이름 (필수)</Label>
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
              className="border-secondary-200"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">이메일 (필수)</Label>
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
              className="border-secondary-200"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "등록 중…" : "회원가입"}
          </Button>
          <p className="text-center text-sm text-secondary-500">
            이미 계정이 있으신가요?{" "}
            <Link href="/login" className="font-medium text-primary-600 hover:underline">
              로그인
            </Link>
          </p>
        </form>
        <figure className="overflow-hidden rounded-xl border border-secondary-200">
          <Image
            src="https://picsum.photos/seed/signup/640/640"
            alt="회원가입"
            width={640}
            height={640}
            className="h-full w-full object-cover"
            priority
          />
        </figure>
      </div>
    </div>
  );
}
