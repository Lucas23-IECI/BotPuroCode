"use client";

import { useSidebar, MobileMenuButton } from "@/components/sidebar";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main className={cn("flex-1 p-4 pt-14 transition-all duration-200 lg:p-6 lg:pt-6", collapsed ? "lg:ml-16" : "lg:ml-64")}>
      <MobileMenuButton />
      {children}
    </main>
  );
}
