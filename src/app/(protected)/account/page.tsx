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
    <div className="container py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">계정</h1>
        <p className="mt-1 text-slate-600">로그인 정보 및 회원탈퇴</p>
      </header>

      <Card className="max-w-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">로그인 정보</CardTitle>
          <CardDescription>현재 로그인한 계정입니다.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-medium text-slate-500">이름</p>
            <p className="mt-0.5 text-sm text-slate-900">{profile?.name ?? "-"}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">이메일</p>
            <p className="mt-0.5 text-sm text-slate-900">{email ?? "-"}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-6 max-w-md border-amber-100">
        <CardHeader>
          <CardTitle className="text-lg text-amber-800">회원탈퇴</CardTitle>
          <CardDescription>
            탈퇴 시 계정이 삭제되며 복구할 수 없습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 border-amber-200 text-amber-800 hover:bg-amber-50 hover:border-amber-300"
            disabled={isWithdrawing || !email?.trim()}
            onClick={handleWithdraw}
          >
            <UserMinus className="h-4 w-4" />
            {isWithdrawing ? "처리 중…" : "회원탈퇴"}
          </Button>
        </CardContent>
      </Card>

      <p className="mt-6 text-sm text-slate-500">
        <Link href="/dashboard" className="text-indigo-600 hover:underline">
          대시보드로 돌아가기
        </Link>
      </p>
    </div>
  );
}
