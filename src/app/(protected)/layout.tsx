"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useRegisteredEmail } from "@/features/auth/hooks/useRegisteredEmail";
import { ProtectedHeader } from "@/features/capture/components/protected-header";

type ProtectedLayoutProps = {
  children: ReactNode;
};

export default function ProtectedLayout({ children }: ProtectedLayoutProps) {
  const { email, mounted } = useRegisteredEmail();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!mounted) return;
    if (!email) {
      router.replace("/");
    }
  }, [email, mounted, pathname, router]);

  if (!mounted || !email) {
    return null;
  }

  return (
    <>
      <ProtectedHeader />
      {children}
    </>
  );
}
