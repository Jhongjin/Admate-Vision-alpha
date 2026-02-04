"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAdvertisers, useDeleteAdvertiser } from "@/features/advertisers/hooks/useAdvertisers";
import { DeleteConfirmSheet } from "@/features/advertisers/components/delete-confirm-sheet";
import type { Advertiser } from "@/features/advertisers/types";
import { useToast } from "@/hooks/use-toast";

export default function AdvertisersPage() {
  const { data: advertisers, isLoading, error } = useAdvertisers();
  const deleteMutation = useDeleteAdvertiser();
  const [deleteTarget, setDeleteTarget] = useState<Advertiser | null>(null);
  const { toast } = useToast();

  const handleDeleteConfirm = () => {
    if (!deleteTarget) return;
    deleteMutation.mutate(deleteTarget.id, {
      onSuccess: () => {
        setDeleteTarget(null);
        toast({ title: "삭제되었습니다.", description: `${deleteTarget.name} 광고주가 삭제되었습니다.` });
      },
      onError: (err) => {
        toast({
          title: "삭제 실패",
          description: err instanceof Error ? err.message : "삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <div className="container py-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">광고주 관리</h1>
          <p className="mt-1 text-secondary-500">
            광고주 정보를 등록·수정·삭제할 수 있습니다.
          </p>
        </div>
        <Button asChild>
          <Link href="/advertisers/new" className="gap-2">
            <Plus className="h-4 w-4" />
            광고주 등록
          </Link>
        </Button>
      </header>

      {error && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              목록을 불러오지 못했습니다. {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <p className="text-secondary-500">목록 불러오는 중…</p>
      )}

      {!isLoading && !error && advertisers && advertisers.length === 0 && (
        <Card className="border-secondary-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-secondary-400" />
            <p className="mt-4 text-secondary-500">등록된 광고주가 없습니다.</p>
            <Button asChild className="mt-4">
              <Link href="/advertisers/new" className="gap-2">
                <Plus className="h-4 w-4" />
                광고주 등록
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && advertisers && advertisers.length > 0 && (
        <ul className="space-y-3">
          {advertisers.map((adv) => (
            <li key={adv.id}>
              <Card className="border-secondary-200">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <h2 className="text-lg font-semibold">{adv.name}</h2>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <Link href={`/advertisers/${adv.id}/edit`} className="gap-1">
                        <Pencil className="h-3.5 w-3.5" />
                        수정
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setDeleteTarget(adv)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      삭제
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-secondary-600">
                  <p>이메일: {adv.email}</p>
                  {adv.contactName && (
                    <p>광고주 담당자: {adv.contactName}</p>
                  )}
                  <p>캠페인 담당자: {adv.campaignManagerName} ({adv.campaignManagerEmail})</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <DeleteConfirmSheet
        open={deleteTarget !== null}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="광고주 삭제"
        description={
          deleteTarget
            ? `"${deleteTarget.name}" 광고주를 정말 삭제하시겠습니까?`
            : ""
        }
        onConfirm={handleDeleteConfirm}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
