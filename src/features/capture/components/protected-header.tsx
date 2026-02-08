"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Camera, LayoutDashboard, FileText, Users, UserCircle, LogOut, ShieldCheck } from "lucide-react";
import { BRAND } from "@/constants/brand";
import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/capture", label: "촬영", icon: Camera },
  { href: "/advertisers", label: "광고주", icon: Users },
  { href: "/reports", label: "보고", icon: FileText },
  { href: "/admin/dashboard", label: "관리자", icon: ShieldCheck },
  { href: "/account", label: "계정", icon: UserCircle },
] as const;

export function ProtectedHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { email, clearRegisteredEmail } = useRegisteredEmail();
  const { profile } = useUserProfile();

  const handleClearEmail = () => {
    clearRegisteredEmail();
    router.replace("/");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 safe-area-padding-x">
      <div className="container flex h-14 min-h-[48px] items-center justify-between gap-2">
        <Link
          href="/"
          className="flex min-h-[44px] min-w-[44px] shrink-0 items-center text-base font-semibold tracking-tight text-slate-900 group mr-auto md:mr-0"
        >
          {BRAND.name} <span className="text-indigo-600 ml-1 group-hover:text-indigo-500 transition-colors hidden md:inline">Vision</span>
        </Link>
        <nav className="flex flex-1 items-center justify-end gap-1 md:justify-center">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              asChild
              variant={pathname === href ? "secondary" : "ghost"}
              size="sm"
              className={cn(
                "min-h-[36px] h-9 shrink-0 gap-1.5 px-2.5 rounded-full transition-all text-sm",
                pathname === href
                  ? "bg-indigo-50 text-indigo-700 font-medium hover:bg-indigo-100"
                  : "text-slate-600 hover:text-slate-900 hover:bg-slate-50",
                // Mobile: icon only (padding optimized for touch target but compact visual)
                "px-2 md:px-3"
              )}
              title={label} // Tooltip for icon-only mode
            >
              <Link href={href} className="flex items-center gap-1.5">
                <Icon className="h-5 w-5 md:h-4 md:w-4 shrink-0" />
                <span className="hidden md:inline">{label}</span>
              </Link>
            </Button>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <span
            className="max-w-[100px] truncate text-xs text-slate-600 sm:max-w-[140px] hidden md:block"
            title={email ?? undefined}
          >
            {profile?.name ? `${profile.name}` : email ?? ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="min-h-[44px] min-w-[44px]"
            onClick={handleClearEmail}
            title="로그아웃"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
