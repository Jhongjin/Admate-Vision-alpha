"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserMinus } from "lucide-react";
import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { withdrawApi, extractApiErrorMessage } from "@/features/auth/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

export default function AccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { email, clearRegisteredEmail } = useRegisteredEmail();
  const { profile } = useUserProfile();
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = useCallback(async () => {
    if (!email?.trim()) return;
    const confirmed = window.confirm(
      "정말 탈퇴하시겠습니까?\n계정이 삭제되며 복구할 수 없습니다."
    );
    if (!confirmed) return;
    setIsWithdrawing(true);
    try {
      await withdrawApi({ email: email.trim() });
      clearRegisteredEmail();
      toast({ title: "회원탈퇴 완료", description: "이용해 주셔서 감사합니다." });
      router.replace("/");
    } catch (err) {
      toast({
        title: "탈퇴 실패",
        description: extractApiErrorMessage(err, "탈퇴 처리 중 오류가 발생했습니다."),
        variant: "destructive",
      });
    } finally {
      setIsWithdrawing(false);
    }
  }, [email, clearRegisteredEmail, router, toast]);

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      <header className="mb-8 text-center sm:text-left">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">내 계정</h1>
        <p className="mt-2 text-slate-600">
          계정 정보를 관리하고 고객센터에 문의할 수 있습니다.
        </p>
      </header>

      <Card className="border-indigo-50 bg-gradient-to-br from-white to-indigo-50/30 overflow-hidden shadow-sm">
        <CardContent className="pt-6 sm:flex sm:items-center sm:gap-6">
          <div className="h-24 w-24 rounded-full bg-white border-4 border-indigo-100 shadow-sm flex items-center justify-center mx-auto sm:mx-0">
            <span className="text-4xl font-bold text-indigo-600">
              {profile?.name ? profile.name.charAt(0) : "U"}
            </span>
          </div>
          <div className="text-center sm:text-left mt-4 sm:mt-0 space-y-1">
            <h2 className="text-2xl font-bold text-slate-900">{profile?.name ?? "사용자"}</h2>
            <p className="text-slate-500 flex items-center justify-center sm:justify-start gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-mail text-slate-400"><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" /></svg>
              {email}
            </p>
            <div className="pt-2">
              <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                AdMate Vision Member
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card className="border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-indigo-900 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-headphones"><path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a9 9 0 0 1 18 0v7a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" /><path d="M14 19a2 2 0 0 1-2 2H0a2 2 0 0 1-2-2" /></svg>
              고객센터
            </CardTitle>
            <CardDescription>
              궁금한 점이나 불편한 점이 있으신가요?
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              asChild
              className="w-full bg-white border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200"
            >
              <a href="mailto:adso@nasmedia.co.kr">
                이메일 문의하기
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-red-100 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg text-red-900 flex items-center gap-2">
              <UserMinus className="h-5 w-5" />
              회원탈퇴
            </CardTitle>
            <CardDescription>
              탈퇴 시 계정이 삭제되며 복구할 수 없습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
              disabled={isWithdrawing || !email?.trim()}
              onClick={handleWithdraw}
            >
              {isWithdrawing ? "처리 중…" : "계정 삭제 진행"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="mt-8 text-center text-sm text-slate-500">
        <Link href="/dashboard" className="text-indigo-600 hover:underline">
          대시보드로 돌아가기
        </Link>
      </p>
    </div>
  );
}
