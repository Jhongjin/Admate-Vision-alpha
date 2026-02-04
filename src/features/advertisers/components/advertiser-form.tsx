"use client";

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
                <Input placeholder="광고주명 입력" {...field} />
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
                <Input type="email" placeholder="example@company.com" {...field} />
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
                <Input placeholder="담당자 이름" {...field} />
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
                <Input placeholder="캠페인 담당자 이름" {...field} />
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
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex gap-2 pt-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "저장 중…" : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
