"use client";

import { use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdvertiserForm } from "@/features/advertisers/components/advertiser-form";
import {
  useAdvertiser,
  useUpdateAdvertiser,
  extractApiErrorMessage,
} from "@/features/advertisers/hooks/useAdvertisers";
import type { AdvertiserCreate } from "@/features/advertisers/backend/schema";
import { useToast } from "@/hooks/use-toast";

type EditAdvertiserPageProps = {
  params: Promise<{ id: string }>;
};

export default function EditAdvertiserPage({ params }: EditAdvertiserPageProps) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const router = useRouter();
  const { data: advertiser, isLoading, error } = useAdvertiser(id);
  const updateMutation = useUpdateAdvertiser(id);
  const { toast } = useToast();

  const handleSubmit = (values: AdvertiserCreate) => {
    if (!id) return;
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast({ title: "수정되었습니다.", description: "광고주 정보가 수정되었습니다." });
        router.push("/advertisers");
      },
      onError: (err) => {
        toast({
          title: "수정 실패",
          description: extractApiErrorMessage(err, "수정 중 오류가 발생했습니다."),
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading || !advertiser) {
    return (
      <div className="container py-8">
        <p className="text-secondary-500">
          {isLoading ? "불러오는 중…" : error?.message ?? "광고주를 찾을 수 없습니다."}
        </p>
        <Button asChild variant="link" className="mt-4">
          <Link href="/advertisers">목록으로</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-8 max-w-2xl">
      <header className="mb-8">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-1 text-slate-500 hover:text-slate-900 -ml-2">
          <Link href="/advertisers">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">광고주 수정</h1>
        <p className="mt-1 text-slate-500">
          <span className="font-semibold text-indigo-600">{advertiser.name}</span> 정보를 수정합니다.
        </p>
      </header>

      <Card className="border-white bg-white/50 shadow-xl shadow-slate-200/40 backdrop-blur-sm">
        <CardHeader className="border-b border-slate-100 bg-white/50 pb-4">
          <h2 className="text-lg font-bold text-slate-800">광고주 정보</h2>
        </CardHeader>
        <CardContent className="pt-6">
          <AdvertiserForm
            defaultValues={advertiser}
            onSubmit={handleSubmit}
            isLoading={updateMutation.isPending}
            submitLabel="수정 저장"
          />
        </CardContent>
      </Card>
    </div>
  );
}
