"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/constants/brand";

import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";

export function PublicHeader() {
  const { email } = useRegisteredEmail();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 safe-area-padding-x">
      <div className="container flex h-14 min-h-[48px] items-center justify-between gap-2">
        <Link
          href="/"
          className="min-h-[44px] min-w-[44px] shrink-0 text-base font-semibold tracking-tight text-slate-900 hover:text-primary-600 flex items-center"
        >
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-1">
          {email ? (
            <Button asChild size="sm" className="min-h-[44px] min-w-[44px] px-3">
              <Link href="/dashboard">대시보드</Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="min-h-[44px] min-w-[44px] px-3">
                <Link href="/login">Sign In</Link>
              </Button>
              <Button asChild size="sm" className="min-h-[44px] min-w-[44px] px-3">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
