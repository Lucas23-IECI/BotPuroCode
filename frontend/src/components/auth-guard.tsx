"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar, SidebarProvider } from "@/components/sidebar";
import { MainContent } from "@/components/main-content";
import { getMe } from "@/lib/api";

const PUBLIC_PATHS = ["/login", "/forgot-password", "/reset-password"];

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (PUBLIC_PATHS.includes(pathname)) {
      setAuthorized(true);
      return;
    }
    const token = localStorage.getItem("botpurocode_token");
    if (!token) {
      router.replace("/login");
      return;
    }
    // Validate token with backend
    getMe()
      .then((user) => {
        localStorage.setItem("botpurocode_user", JSON.stringify(user));
        setAuthorized(true);
      })
      .catch(() => {
        localStorage.removeItem("botpurocode_token");
        localStorage.removeItem("botpurocode_user");
        router.replace("/login");
      });
  }, [pathname, router]);

  if (!authorized) return null;

  if (PUBLIC_PATHS.includes(pathname)) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen">
        <Sidebar />
        <MainContent>{children}</MainContent>
      </div>
    </SidebarProvider>
  );
}
