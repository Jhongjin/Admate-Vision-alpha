"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Camera, LayoutDashboard, FileText, Users, LogOut } from "lucide-react";
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
    <header className="sticky top-0 z-10 border-b border-secondary-200 bg-white">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/capture"
          className="text-lg font-semibold text-primary-500 hover:text-primary-600"
        >
          옥외 광고 게재 현황 자동 보고 툴
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
          <span className="max-w-[180px] truncate text-sm text-secondary-500" title={email ?? undefined}>
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
