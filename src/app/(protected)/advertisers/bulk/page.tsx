"use client";

import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { ArrowLeft, Upload, AlertCircle, CheckCircle2, FileUp, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { createAdvertisersBulk, extractApiErrorMessage } from "@/features/advertisers/api";
import type { AdvertiserCreate, AdvertiserBulkResult } from "@/features/advertisers/backend/schema";
import { AdvertiserCreateSchema } from "@/features/advertisers/backend/schema";
import { useQueryClient } from "@tanstack/react-query";
import { advertisersQueryKey } from "@/features/advertisers/hooks/useAdvertisers";
import { useToast } from "@/hooks/use-toast";

/** CSV 한 줄 파싱 (쉼표 구분, 따옴표 필드 지원) */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      i++;
      let field = "";
      while (i < line.length) {
        if (line[i] === '"' && line[i + 1] === '"') {
          field += '"';
          i += 2;
        } else if (line[i] === '"') {
          i++;
          break;
        } else {
          field += line[i];
          i++;
        }
      }
      result.push(field.trim());
    } else {
      let field = "";
      while (i < line.length && line[i] !== ",") {
        field += line[i];
        i++;
      }
      result.push(field.trim());
      if (i < line.length && line[i] === ",") i++;
    }
  }
  return result;
}

const CSV_HEADER =
  "광고주명,이메일,광고주담당자,캠페인담당자이름,캠페인담당자이메일,검색어";

/** CSV 양식 샘플 내용 (헤더 + 예시 2행) */
const CSV_SAMPLE_CONTENT = [
  CSV_HEADER,
  "카카오뱅크,woolela@nasmedia.co.kr,전광고주,전캠페인,woolela@nasmedia.co.kr,\"kakaobank, 카카오뱅크\"",
  "삼성전자,contact@samsung.com,,홍길동,contact@samsung.com,\"Samsung, 삼성전자\"",
].join("\n");

function downloadSampleCSV() {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + CSV_SAMPLE_CONTENT], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "광고주_벌크등록_양식.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function isHeaderRow(cols: string[]): boolean {
  const first = (cols[0] ?? "").trim().toLowerCase();
  return first === "광고주명" || first === "name" || first.includes("광고주");
}

function parseCSVToAdvertisers(text: string): AdvertiserCreate[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const result: AdvertiserCreate[] = [];
  let startIndex = 0;
  if (lines.length > 0) {
    const firstCols = parseCSVLine(lines[0]);
    if (isHeaderRow(firstCols)) {
      startIndex = 1;
    }
  }
  for (let idx = startIndex; idx < lines.length; idx++) {
    const cols = parseCSVLine(lines[idx]);
    if (cols.length < 5) continue;
    const name = cols[0] ?? "";
    const email = cols[1] ?? "";
    const contactName = cols[2] ?? "";
    const campaignManagerName = cols[3] ?? "";
    const campaignManagerEmail = cols[4] ?? "";
    const searchTermsStr = cols[5] ?? "";
    const searchTerms = searchTermsStr
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    result.push({
      name,
      email,
      contactName: contactName || undefined,
      campaignManagerName,
      campaignManagerEmail,
      searchTerms,
    });
  }
  return result;
}

function validateRow(row: AdvertiserCreate, index: number): string | null {
  const parsed = AdvertiserCreateSchema.safeParse(row);
  if (parsed.success) return null;
  const msg = parsed.error.errors.map((e) => e.message).join("; ");
  return `${index + 1}행: ${msg}`;
}

export default function AdvertisersBulkPage() {
  const [rows, setRows] = useState<AdvertiserCreate[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [onDuplicate, setOnDuplicate] = useState<"skip" | "overwrite">("skip");
  const [result, setResult] = useState<AdvertiserBulkResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const validationErrors = rows.map((row, i) => validateRow(row, i)).filter(Boolean) as string[];

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setResult(null);
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const parsed = parseCSVToAdvertisers(text);
      setRows(parsed);
    };
    reader.readAsText(file, "UTF-8");
    e.target.value = "";
  }, []);

  const handleSubmit = useCallback(async () => {
    if (rows.length === 0) {
      toast({
        title: "파일을 선택해 주세요",
        description: "CSV 파일을 업로드한 뒤 등록해 주세요.",
        variant: "destructive",
      });
      return;
    }
    if (validationErrors.length > 0) {
      toast({
        title: "입력 오류",
        description:
          validationErrors.slice(0, 2).join("\n") + (validationErrors.length > 2 ? " …" : ""),
        variant: "destructive",
      });
      return;
    }
    setIsSubmitting(true);
    setResult(null);
    try {
      const bulkResult = await createAdvertisersBulk(rows, onDuplicate);
      setResult(bulkResult);
      queryClient.invalidateQueries({ queryKey: advertisersQueryKey });
      const parts = [
        bulkResult.created > 0 && `등록 ${bulkResult.created}건`,
        bulkResult.updated > 0 && `덮어쓰기 ${bulkResult.updated}건`,
        bulkResult.skipped > 0 && `건너뜀 ${bulkResult.skipped}건`,
      ].filter(Boolean);
      toast({
        title: "벌크 등록 완료",
        description: parts.join(", "),
      });
    } catch (err) {
      toast({
        title: "벌크 등록 실패",
        description: extractApiErrorMessage(err, "등록 중 오류가 발생했습니다."),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [rows, validationErrors.length, onDuplicate, toast, queryClient]);

  return (
    <div className="container py-8">
      <header className="mb-6">
        <Button asChild variant="ghost" size="sm" className="mb-4 gap-1">
          <Link href="/advertisers">
            <ArrowLeft className="h-4 w-4" />
            목록으로
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-slate-900">광고주 벌크 등록</h1>
        <p className="mt-1 text-slate-600">
          CSV 파일을 업로드하면 한 번에 등록합니다. 광고주명 기준 중복 검사 및 옵션(덮어쓰기/건너뛰기)이 적용됩니다.
        </p>
      </header>

      <Card className="mb-6 border-slate-200">
        <CardHeader>
          <h2 className="text-lg font-semibold">CSV 파일 업로드</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border border-slate-200 bg-slate-50/50 p-4 text-sm text-slate-700">
            <p className="font-medium text-slate-800 mb-2">안내</p>
            <ul className="list-inside list-disc space-y-1">
              <li>
                <strong>중복 기준</strong>: 광고주명·검색어(한글/영문 동일 브랜드) 기준으로 중복을 체크합니다.
              </li>
              <li>
                <strong>업로드 시 중복이 있을 경우</strong>: 아래 옵션 중 하나를 선택하세요.
              </li>
              <li>
                <strong>건너뛰기</strong>: 이미 등록된 광고주는 건너뛰고, 나머지만 새로 등록합니다.
              </li>
              <li>
                <strong>덮어쓰기</strong>: 이미 등록된 광고주는 해당 행 데이터로 수정(덮어쓰기)하고, 나머지는 새로 등록합니다.
              </li>
            </ul>
          </div>

          <div>
            <Label className="text-slate-700">CSV 형식</Label>
            <p className="mt-1 text-xs text-slate-500">
              첫 줄은 헤더로 두거나 생략할 수 있습니다. 아래 열 순서와 필수/옵션을 지켜 주세요.
            </p>
            <ul className="mt-2 space-y-1 text-sm text-slate-700">
              <li><strong>광고주명</strong> — 필수</li>
              <li><strong>이메일</strong> — 필수</li>
              <li><strong>광고주담당자</strong> — 옵션 (비워두면 무시)</li>
              <li><strong>캠페인담당자이름</strong> — 필수</li>
              <li><strong>캠페인담당자이메일</strong> — 필수</li>
              <li><strong>검색어</strong> — 옵션 (쉼표·세미콜론으로 여러 개 입력 가능)</li>
            </ul>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <pre className="rounded bg-slate-100 px-2 py-1 text-xs text-slate-600">
                {CSV_HEADER}
              </pre>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={downloadSampleCSV}
              >
                <Download className="h-3.5 w-3.5" />
                CSV 양식 샘플 다운로드
              </Button>
            </div>
          </div>

          <div>
            <Label className="text-slate-700">중복 시 동작</Label>
            <div className="mt-2 flex flex-col gap-3">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="onDuplicate"
                  value="skip"
                  checked={onDuplicate === "skip"}
                  onChange={() => setOnDuplicate("skip")}
                  className="h-4 w-4 border-slate-300"
                />
                <span className="text-sm">
                  건너뛰기 — 중복된 광고주는 스킵하고 나머지만 등록
                </span>
              </label>
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="radio"
                  name="onDuplicate"
                  value="overwrite"
                  checked={onDuplicate === "overwrite"}
                  onChange={() => setOnDuplicate("overwrite")}
                  className="h-4 w-4 border-slate-300"
                />
                <span className="text-sm">
                  덮어쓰기 — 중복된 광고주는 업로드 데이터로 수정
                </span>
              </label>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,text/csv,application/csv"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileUp className="h-4 w-4" />
              CSV 파일 선택
            </Button>
            {fileName && (
              <span className="text-sm text-slate-500">
                선택됨: {fileName} ({rows.length}건)
              </span>
            )}
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || rows.length === 0}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              {isSubmitting ? "등록 중…" : `${rows.length}건 등록`}
            </Button>
          </div>

          {rows.length > 0 && validationErrors.length > 0 && (
            <p className="text-sm text-amber-700">
              검증 오류 {validationErrors.length}건 — 수정 후 다시 업로드하거나, 오류 행은 등록 시 건너뜁니다.
            </p>
          )}
        </CardContent>
      </Card>

      {validationErrors.length > 0 && validationErrors.length <= 10 && (
        <Card className="mb-6 border-amber-200 bg-amber-50/50">
          <CardContent className="py-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-medium text-amber-800">
              <AlertCircle className="h-4 w-4" />
              입력 검증 오류
            </p>
            <ul className="list-inside list-disc text-sm text-amber-700">
              {validationErrors.map((msg, i) => (
                <li key={i}>{msg}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-slate-200">
          <CardHeader>
            <h2 className="text-lg font-semibold">등록 결과</h2>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-4">
              {result.created > 0 && (
                <span className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  등록됨: {result.created}건
                </span>
              )}
              {result.updated > 0 && (
                <span className="flex items-center gap-2 text-blue-700">
                  <CheckCircle2 className="h-4 w-4" />
                  덮어쓰기: {result.updated}건
                </span>
              )}
              {result.skipped > 0 && (
                <span className="flex items-center gap-2 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  건너뜀: {result.skipped}건
                </span>
              )}
            </div>
            {result.errors.length > 0 && (
              <ul className="max-h-48 overflow-y-auto rounded bg-slate-100 p-3 text-sm text-slate-700">
                {result.errors.map((e, i) => (
                  <li key={i}>
                    {e.rowIndex}행: {e.message}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
