"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useState } from "react";
import {
  LayoutDashboard,
  Users,
  Search,
  Upload,
  BarChart3,
  GitBranch,
  Download,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/leads", label: "Leads", icon: Users },
  { href: "/buscar", label: "Buscar OSM", icon: Search },
  { href: "/ingesta", label: "Ingesta", icon: Upload },
  { href: "/pipeline", label: "Pipeline CRM", icon: GitBranch },
  { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
  { href: "/export", label: "Exportar", icon: Download },
];

const SidebarCtx = createContext({ collapsed: false, toggle: () => {} });
export const useSidebar = () => useContext(SidebarCtx);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <SidebarCtx.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>
      {children}
    </SidebarCtx.Provider>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 h-screen border-r border-border bg-card transition-all duration-200",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border px-3">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <div className="h-8 w-8 shrink-0 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">PC</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-foreground">BotPuroCode</h1>
              <p className="text-[10px] text-muted-foreground">Motor de Leads</p>
            </div>
          )}
        </Link>
        <button
          onClick={toggle}
          className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 p-2">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg px-3 py-2 text-sm transition-colors",
                collapsed ? "justify-center" : "gap-3",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
