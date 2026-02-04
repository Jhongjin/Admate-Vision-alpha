"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Camera, LayoutDashboard, FileText, Users, LogOut } from "lucide-react";
import { BRAND } from "@/constants/brand";
import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "대시보드", icon: LayoutDashboard },
  { href: "/capture", label: "촬영", icon: Camera },
  { href: "/advertisers", label: "광고주 관리", icon: Users },
  { href: "/reports", label: "보고 목록", icon: FileText },
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
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/capture"
          className="text-lg font-semibold tracking-tight text-slate-900 hover:text-primary-600"
        >
          {BRAND.name} <span className="text-primary-600">Vision</span>
        </Link>
        <nav className="flex items-center gap-1">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Button
              key={href}
              asChild
              variant={pathname === href ? "secondary" : "ghost"}
              size="sm"
            >
              <Link
                href={href}
                className={cn(
                  "gap-2",
                  pathname === href && "bg-primary-100 text-primary-700"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            </Button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <span className="max-w-[180px] truncate text-sm text-slate-600" title={email ?? undefined}>
            {profile?.name ? `${profile.name} (${email ?? ""})` : email ?? ""}
          </span>
          <Button
            variant="ghost"
            size="icon"
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
