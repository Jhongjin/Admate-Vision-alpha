"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/constants/brand";
import { LogOut, User } from "lucide-react";

import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { clearRegisteredEmail } from "@/lib/registered-email";

export function PublicHeader() {
  const { email } = useRegisteredEmail();
  const { profile } = useUserProfile();

  const handleLogout = () => {
    if (confirm("로그아웃 하시겠습니까?")) {
      clearRegisteredEmail();
      window.location.href = "/"; // Refresh logic
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 safe-area-padding-x">
      <div className="container flex h-14 min-h-[48px] items-center justify-between gap-2">
        <Link
          href="/"
          className="min-h-[44px] min-w-[44px] shrink-0 text-base font-semibold tracking-tight text-slate-900 hover:text-primary-600 flex items-center whitespace-nowrap"
        >
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-1">
          {email ? (
            <div className="flex items-center gap-3">
              <Button asChild size="sm" className="min-h-[44px] px-4 font-medium bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm border border-transparent">
                <Link href="/dashboard">대시보드</Link>
              </Button>
              <div className="hidden md:flex items-center gap-1.5 text-sm font-medium text-slate-600 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
                <User className="h-3.5 w-3.5 text-slate-400" />
                <span>{profile?.name ?? email?.split("@")[0]}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="h-9 w-9 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                title="로그아웃"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
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
