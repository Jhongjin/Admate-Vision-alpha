"use client";

import Link from "next/link";
import { BRAND } from "@/constants/brand";

const footerLinks = {
  product: [
    { label: "촬영", href: "/capture" },
    { label: "광고주 관리", href: "/advertisers" },
    { label: "보고 목록", href: "/reports" },
  ],
  resources: [
    { label: "대시보드", href: "/dashboard" },
  ],
  company: [
    { label: "로그인", href: "/login" },
    { label: "회원가입", href: "/signup" },
  ],
} as const;

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/50">
      <div className="container py-12">
        <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <p className="text-sm font-semibold text-slate-900">{BRAND.name}</p>
            <p className="mt-1 text-xs text-slate-500">
              {BRAND.visionTagline}
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Product
            </p>
            <ul className="mt-3 space-y-2">
              {footerLinks.product.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Resources
            </p>
            <ul className="mt-3 space-y-2">
              {footerLinks.resources.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Account
            </p>
            <ul className="mt-3 space-y-2">
              {footerLinks.company.map(({ label, href }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-slate-600 hover:text-slate-900"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-200 pt-8">
          <p className="text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {BRAND.name}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
