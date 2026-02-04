"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { AdvertiserForm } from "@/features/advertisers/components/advertiser-form";
import { useCreateAdvertiser, extractApiErrorMessage } from "@/features/advertisers/hooks/useAdvertisers";
import type { AdvertiserCreate } from "@/features/advertisers/backend/schema";
import { useToast } from "@/hooks/use-toast";

export default function NewAdvertiserPage() {
  const router = useRouter();
  const createMutation = useCreateAdvertiser();
  const { toast } = useToast();

  const handleSubmit = (values: AdvertiserCreate) => {
    createMutation.mutate(values, {
      onSuccess: () => {
        toast({ title: "등록되었습니다.", description: "광고주가 등록되었습니다." });
        router.push("/advertisers");
      },
      onError: (err) => {
        toast({
          title: "등록 실패",
          description: extractApiErrorMessage(err, "등록 중 오류가 발생했습니다."),
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="container py-8">
      <header className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-1">
          <Link href="/advertisers">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">광고주 등록</h1>
        <p className="mt-1 text-secondary-500">
          광고주 정보를 입력한 뒤 저장하세요.
        </p>
      </header>

      <Card className="border-secondary-200">
        <CardHeader>
          <h2 className="text-lg font-semibold">광고주 정보</h2>
        </CardHeader>
        <CardContent>
          <AdvertiserForm
            onSubmit={handleSubmit}
            isLoading={createMutation.isPending}
            submitLabel="등록"
          />
        </CardContent>
      </Card>
    </div>
  );
}
