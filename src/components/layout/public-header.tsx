"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND } from "@/constants/brand";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="container flex h-14 items-center justify-between">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-slate-900 hover:text-primary-600"
        >
          {BRAND.name}
        </Link>
        <nav className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/login">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/signup">Sign Up</Link>
          </Button>
        </nav>
      </div>
    </header>
  );
}
