"use client";

import Link from "next/link";
import { BRAND } from "@/constants/brand";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const footerLinks = {
  product: [
    { label: "촬영", href: "/capture" },
    { label: "광고주 관리", href: "/advertisers" },
    { label: "보고 목록", href: "/reports" },
  ],
  resources: [{ label: "대시보드", href: "/dashboard" }],
  account: [
    { label: "로그인", href: "/login" },
    { label: "회원가입", href: "/signup" },
  ],
} as const;

const familySites = [
  "AdMate Vision DA",
  "AdMate Guide",
  "AdMate Sentinel",
  "AdMate Media Planning",
];

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/50 safe-area-padding-x safe-area-padding-bottom">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row md:justify-between gap-8 md:gap-12">
          {/* Brand & Tagline */}
          <div className="md:max-w-xs">
            <p className="text-sm font-semibold text-slate-900">{BRAND.name}</p>
            <p className="mt-1 text-xs text-slate-500">{BRAND.visionTagline}</p>
          </div>

          {/* Links Grid */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:gap-12 w-full md:w-auto">
            {/* Product */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Product
              </p>
              <ul className="mt-3 space-y-2">
                {footerLinks.product.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Account */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Account
              </p>
              <ul className="mt-3 space-y-2">
                {footerLinks.account.map(({ label, href }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="block text-sm text-slate-600 hover:text-slate-900 transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Family SiteDropdown */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
                Family Site
              </p>
              <Select
                onValueChange={(value) => {
                  // 현재는 클릭 안되게 처리 (이동 로직 없음)
                  // 향후 구현 시 window.open(...) 사용
                }}
              >
                <SelectTrigger className="w-full border-slate-200 bg-white text-slate-600 shadow-sm hover:bg-slate-50 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500">
                  <SelectValue placeholder="Family Sites" />
                </SelectTrigger>
                <SelectContent>
                  {familySites.map((site) => (
                    <SelectItem key={site} value={site}>
                      {site}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 border-t border-slate-200 pt-6">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Kt Nasmedia {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
