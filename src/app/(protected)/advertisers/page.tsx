"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Users, Search, Upload, ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAdvertisers, useDeleteAdvertiser } from "@/features/advertisers/hooks/useAdvertisers";
import { DeleteConfirmSheet } from "@/features/advertisers/components/delete-confirm-sheet";
import type { Advertiser } from "@/features/advertisers/types";
import { useToast } from "@/hooks/use-toast";

function filterAdvertisers(list: Advertiser[], query: string): Advertiser[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((adv) => {
    const name = adv.name.toLowerCase();
    const email = (adv.email ?? "").toLowerCase();
    const terms = (adv.searchTerms ?? []).join(" ").toLowerCase();
    return name.includes(q) || email.includes(q) || terms.includes(q);
  });
}

const CSV_HEADER = "광고주명,이메일,광고주담당자,캠페인담당자이름,캠페인담당자이메일,검색어";

function escapeCsvField(value: string): string {
  if (!/[",\r\n]/.test(value)) return value;
  return `"${value.replace(/"/g, '""')}"`;
}

function downloadAdvertisersCsv(list: Advertiser[]) {
  const rows = list.map((adv) => {
    const name = escapeCsvField(adv.name);
    const email = escapeCsvField(adv.email ?? "");
    const contactName = escapeCsvField(adv.contactName ?? "");
    const campaignManagerName = escapeCsvField(adv.campaignManagerName ?? "");
    const campaignManagerEmail = escapeCsvField(adv.campaignManagerEmail ?? "");
    const searchTerms = escapeCsvField((adv.searchTerms ?? []).join(", "));
    return [name, email, contactName, campaignManagerName, campaignManagerEmail, searchTerms].join(",");
  });
  const content = [CSV_HEADER, ...rows].join("\n");
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "광고주_목록.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdvertisersPage() {
  const { data: advertisers, isLoading, error } = useAdvertisers();
  const deleteMutation = useDeleteAdvertiser();
  const [deleteTarget, setDeleteTarget] = useState<Advertiser | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const { toast } = useToast();

  const filteredAdvertisers = useMemo(
    () => (advertisers ? filterAdvertisers(advertisers, searchQuery) : []),
    [advertisers, searchQuery]
  );

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
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">광고주 관리</h1>
          <p className="mt-1 text-slate-600">
            광고주 정보를 등록·수정·삭제할 수 있습니다.
          </p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="gap-2 min-h-[44px]">
              <Plus className="h-4 w-4" />
              광고주 등록
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <DropdownMenuItem asChild>
              <Link href="/advertisers/new" className="flex items-center gap-2 cursor-pointer">
                <Plus className="h-4 w-4" />
                단일 등록
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/advertisers/bulk" className="flex items-center gap-2 cursor-pointer">
                <Upload className="h-4 w-4" />
                벌크 등록
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {advertisers && advertisers.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="광고주명, 이메일, 검색어로 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 min-h-[44px]"
              aria-label="광고주 검색"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="gap-2 min-h-[44px]"
            onClick={() => downloadAdvertisersCsv(filteredAdvertisers)}
          >
            <Download className="h-4 w-4" />
            목록 다운로드 (CSV)
          </Button>
        </div>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50/50">
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              목록을 불러오지 못했습니다. {error.message}
            </p>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <p className="text-slate-600">목록 불러오는 중…</p>
      )}

      {!isLoading && !error && advertisers && advertisers.length === 0 && (
        <Card className="border-slate-200">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-slate-400" />
            <p className="mt-4 text-slate-600">등록된 광고주가 없습니다.</p>
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
          {filteredAdvertisers.length === 0 ? (
            <Card className="border-slate-200">
              <CardContent className="py-8 text-center text-slate-600">
                검색 결과가 없습니다. 다른 검색어를 입력해 보세요.
              </CardContent>
            </Card>
          ) : (
          filteredAdvertisers.map((adv) => (
            <li key={adv.id}>
              <Card className="border-slate-200">
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
                <CardContent className="space-y-1 text-sm text-slate-600">
                  <p>이메일: {adv.email}</p>
                  {adv.contactName && (
                    <p>광고주 담당자: {adv.contactName}</p>
                  )}
                  <p>캠페인 담당자: {adv.campaignManagerName} ({adv.campaignManagerEmail})</p>
                </CardContent>
              </Card>
            </li>
          ))
          )}
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
