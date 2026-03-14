"use client";

import { useSidebar } from "@/components/sidebar";
import { cn } from "@/lib/utils";

export function MainContent({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();
  return (
    <main className={cn("flex-1 p-6 transition-all duration-200", collapsed ? "ml-16" : "ml-64")}>
      {children}
    </main>
  );
}
