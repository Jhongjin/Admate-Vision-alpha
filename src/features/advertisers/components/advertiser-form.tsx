"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  AdvertiserCreateSchema,
  type AdvertiserCreate,
} from "@/features/advertisers/backend/schema";
import type { Advertiser } from "@/features/advertisers/types";

type AdvertiserFormValues = AdvertiserCreate;

type AdvertiserFormProps = {
  defaultValues?: Partial<Advertiser>;
  onSubmit: (values: AdvertiserCreate) => void;
  isLoading?: boolean;
  submitLabel?: string;
};

const defaultFormValues: AdvertiserFormValues = {
  name: "",
  email: "",
  contactName: "",
  campaignManagerName: "",
  campaignManagerEmail: "",
  searchTerms: [],
};

/** 쉼표를 그대로 입력할 수 있도록 로컬 문자열로 보여주고, blur 시에만 배열로 변환해 form에 반영 */
function SearchTermsInput({
  field,
}: {
  field: { value: string[]; onChange: (v: string[]) => void; onBlur: () => void };
}) {
  const [text, setText] = useState(() => (field.value ?? []).join(", "));

  useEffect(() => {
    setText((field.value ?? []).join(", "));
  }, [field.value?.join(",")]);

  const handleBlur = () => {
    const arr = text
      .split(/[,\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    field.onChange(arr);
    field.onBlur();
  };

  return (
    <FormItem>
      <FormLabel>검색어 (옵션)</FormLabel>
      <FormControl>
        <Input
          placeholder="kakaobank, 카카오뱅크 (쉼표 또는 공백 구분)"
          lang="ko"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
        />
      </FormControl>
      <p className="text-xs text-slate-500">
        한글·영문 동일 브랜드 검색어를 쉼표 또는 공백으로 구분해 입력하면 중복 등록 방지 및 OCR 매칭에 사용됩니다.
      </p>
      <FormMessage />
    </FormItem>
  );
}

export function AdvertiserForm({
  defaultValues,
  onSubmit,
  isLoading = false,
  submitLabel = "저장",
}: AdvertiserFormProps) {
  const form = useForm<AdvertiserFormValues>({
    resolver: zodResolver(AdvertiserCreateSchema),
    defaultValues: defaultValues
      ? {
        name: defaultValues.name ?? "",
        email: defaultValues.email ?? "",
        contactName: defaultValues.contactName ?? "",
        campaignManagerName: defaultValues.campaignManagerName ?? "",
        campaignManagerEmail: defaultValues.campaignManagerEmail ?? "",
        searchTerms: defaultValues.searchTerms ?? [],
      }
      : defaultFormValues,
  });

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
      >
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>광고주명 (필수)</FormLabel>
              <FormControl>
                <Input
                  placeholder="광고주명 입력"
                  lang="ko"
                  autoComplete="organization"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>이메일 (필수)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="example@company.com"
                  lang="en"
                  inputMode="email"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contactName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>광고주 담당자 이름 (옵션)</FormLabel>
              <FormControl>
                <Input
                  placeholder="담당자 이름"
                  lang="ko"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="campaignManagerName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>캠페인 담당자 이름 (필수)</FormLabel>
              <FormControl>
                <Input
                  placeholder="캠페인 담당자 이름"
                  lang="ko"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="campaignManagerEmail"
          render={({ field }) => (
            <FormItem>
              <FormLabel>캠페인 담당자 이메일 (필수)</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="campaign@company.com"
                  lang="en"
                  inputMode="email"
                  autoComplete="email"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="searchTerms"
          render={({ field }) => (
            <SearchTermsInput field={field} />
          )}
        />
        <div className="flex gap-2 pt-4">
          <Button type="submit" disabled={isLoading} size="lg" className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/20 font-bold">
            {isLoading ? "저장 중…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
