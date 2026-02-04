"use client";

import { useCallback, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-10 px-6 py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-semibold text-gray-900">로그인</h1>
        <p className="text-secondary-500">
          가입한 이메일로 로그인하세요.
        </p>
      </header>
      <div className="grid w-full gap-8 md:grid-cols-2">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 rounded-xl border border-secondary-200 bg-white p-6 shadow-sm"
        >
          <div className="space-y-2">
            <Label htmlFor="email">이메일</Label>
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
              className="border-secondary-200"
            />
          </div>
          <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "로그인 중…" : "로그인"}
          </Button>
          <p className="text-center text-sm text-secondary-500">
            계정이 없으신가요?{" "}
            <Link href="/signup" className="font-medium text-primary-600 hover:underline">
              회원가입
            </Link>
          </p>
        </form>
        <figure className="overflow-hidden rounded-xl border border-secondary-200">
          <Image
            src="https://picsum.photos/seed/login/640/640"
            alt="로그인"
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
