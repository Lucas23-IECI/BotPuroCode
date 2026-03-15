"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { useTheme } from "next-themes";
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
  Sun,
  Moon,
  Menu,
  X,
  MapPin,
  MessageSquareText,
  Bell,
  LogOut,
  FileText,
  Settings,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getNotificaciones, marcarNotificacionLeida, marcarTodasLeidas, type Notificacion } from "@/lib/api";
import { useRouter } from "next/navigation";

const NAV_SECTIONS = [
  {
    label: "Principal",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/leads", label: "Leads", icon: Users },
      { href: "/pipeline", label: "Pipeline CRM", icon: GitBranch },
      { href: "/estadisticas", label: "Estadísticas", icon: BarChart3 },
    ],
  },
  {
    label: "Herramientas",
    items: [
      { href: "/buscar", label: "Buscar OSM", icon: Search },
      { href: "/ingesta", label: "Ingesta", icon: Upload },
      { href: "/mapa", label: "Mapa", icon: MapPin },
      { href: "/plantillas", label: "Plantillas", icon: MessageSquareText },
      { href: "/propuestas", label: "Propuestas", icon: FileText },
      { href: "/automatizaciones", label: "Automatizaciones", icon: Zap },
    ],
  },
  {
    label: "Sistema",
    items: [
      { href: "/export", label: "Exportar", icon: Download },
      { href: "/config", label: "Configuración", icon: Settings },
    ],
  },
];

// Flatten for compatibility
const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

const SidebarCtx = createContext({ collapsed: false, toggle: () => {}, mobileOpen: false, setMobileOpen: (_v: boolean) => {} });
export const useSidebar = () => useContext(SidebarCtx);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <SidebarCtx.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c), mobileOpen, setMobileOpen }}>
      {children}
    </SidebarCtx.Provider>
  );
}

function ThemeToggle({ collapsed }: { collapsed: boolean }) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  const isDark = theme === "dark";

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "flex items-center rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
        collapsed ? "justify-center" : "gap-3"
      )}
      title={isDark ? "Modo claro" : "Modo oscuro"}
    >
      {isDark ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
      {!collapsed && (isDark ? "Modo claro" : "Modo oscuro")}
    </button>
  );
}

export function MobileMenuButton() {
  const { setMobileOpen } = useSidebar();
  return (
    <button
      onClick={() => setMobileOpen(true)}
      className="fixed left-3 top-3 z-50 rounded-lg border border-border bg-card p-2 text-foreground shadow-lg lg:hidden"
      aria-label="Abrir menu"
    >
      <Menu className="h-5 w-5" />
    </button>
  );
}

export function Sidebar() {
  const pathname = usePathname();
  const { collapsed, toggle, mobileOpen, setMobileOpen } = useSidebar();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname, setMobileOpen]);

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen border-r border-border/50 bg-card/95 backdrop-blur-sm transition-all duration-200",
          // Desktop
          "max-lg:hidden",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <SidebarInner collapsed={collapsed} toggle={toggle} pathname={pathname} />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 h-screen w-64 border-r border-border/50 bg-card/95 backdrop-blur-sm transition-transform duration-200 lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="absolute right-2 top-3">
          <button
            onClick={() => setMobileOpen(false)}
            className="rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <SidebarInner collapsed={false} toggle={toggle} pathname={pathname} />
      </aside>
    </>
  );
}

function SidebarInner({ collapsed, toggle, pathname }: { collapsed: boolean; toggle: () => void; pathname: string }) {
  const router = useRouter();
  const [noLeidas, setNoLeidas] = useState(0);
  const [notifList, setNotifList] = useState<Notificacion[]>([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const fetchNotifs = () => {
    getNotificaciones()
      .then((data) => {
        setNoLeidas(data.noLeidas ?? 0);
        setNotifList(data.notificaciones?.slice(0, 5) ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("botpurocode_token");
    localStorage.removeItem("botpurocode_user");
    window.location.href = "/login";
  };

  const isLoggedIn = typeof window !== "undefined" && !!localStorage.getItem("botpurocode_token");

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-border/50 px-3">
        <Link href="/" className="flex items-center gap-2.5 overflow-hidden">
          <div className="h-9 w-9 shrink-0 rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-md shadow-violet-500/20">
            <span className="text-sm font-bold text-white">PC</span>
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-bold text-foreground tracking-tight">BotPuroCode</h1>
              <p className="text-[10px] text-muted-foreground">Motor de Leads</p>
            </div>
          )}
        </Link>
        <button
          onClick={toggle}
          className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors max-lg:hidden"
          title={collapsed ? "Expandir" : "Colapsar"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
        {NAV_SECTIONS.map((section, si) => (
          <div key={section.label}>
            {!collapsed && si > 0 && (
              <div className="mb-1 mt-3 px-3">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
                  {section.label}
                </p>
              </div>
            )}
            {collapsed && si > 0 && (
              <div className="my-2 mx-3 border-t border-border/50" />
            )}
            {section.items.map((item) => {
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
                    "group relative flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
                    collapsed ? "justify-center" : "gap-3",
                    isActive
                      ? "bg-gradient-to-r from-violet-600/10 to-blue-600/10 text-violet-600 dark:text-violet-400"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-600 to-blue-600" />
                  )}
                  <item.icon className={cn("h-4 w-4 shrink-0 transition-colors", isActive && "text-violet-600 dark:text-violet-400")} />
                  {!collapsed && item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: notifications, theme, logout */}
      <div className="border-t border-border/50 p-2 space-y-0.5">
        {/* Notification bell + dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifDropdown((v) => !v)}
            title={collapsed ? `Notificaciones (${noLeidas})` : undefined}
            className={cn(
              "relative flex w-full items-center rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-accent hover:text-foreground",
              collapsed ? "justify-center" : "gap-3"
            )}
          >
            <div className="relative">
              <Bell className="h-4 w-4 shrink-0" />
              {noLeidas > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gradient-to-r from-violet-500 to-blue-500 px-1 text-[10px] font-bold text-white shadow-sm shadow-violet-500/30">
                  {noLeidas > 9 ? "9+" : noLeidas}
                </span>
              )}
            </div>
            {!collapsed && "Notificaciones"}
          </button>
          {showNotifDropdown && (
            <div className={cn(
              "absolute bottom-full mb-2 w-80 rounded-2xl border border-border/50 bg-card shadow-2xl shadow-black/10 z-50 overflow-hidden animate-scale-in",
              collapsed ? "left-full ml-2" : "left-0"
            )}>
              <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground">Notificaciones</span>
                {noLeidas > 0 && (
                  <button onClick={() => { marcarTodasLeidas().then(fetchNotifs); }} className="text-[10px] font-medium text-violet-500 hover:text-violet-400 transition-colors">Leer todas</button>
                )}
              </div>
              <div className="max-h-60 overflow-y-auto">
                {notifList.length === 0 ? (
                  <div className="flex flex-col items-center gap-1 p-6 text-muted-foreground">
                    <Bell className="h-5 w-5 opacity-30" />
                    <p className="text-xs">Sin notificaciones</p>
                  </div>
                ) : (
                  notifList.map((n) => (
                    <button
                      key={n.id}
                      onClick={() => {
                        if (!n.leida) marcarNotificacionLeida(n.id).then(fetchNotifs);
                        setShowNotifDropdown(false);
                      }}
                      className={cn(
                        "w-full text-left px-4 py-2.5 text-xs hover:bg-accent/50 transition-colors border-b border-border/30 last:border-0",
                        !n.leida && "bg-violet-500/5"
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        <span className={cn("font-semibold", n.leida ? "text-foreground" : "text-violet-600 dark:text-violet-400")}>{n.titulo}</span>
                        {!n.leida && <div className="h-1.5 w-1.5 rounded-full bg-violet-500" />}
                      </div>
                      <p className="text-muted-foreground truncate">{n.mensaje}</p>
                    </button>
                  ))
                )}
              </div>
              <button
                onClick={() => { setShowNotifDropdown(false); router.push("/notificaciones"); }}
                className="w-full border-t border-border/50 px-4 py-2.5 text-center text-xs font-medium text-violet-500 hover:bg-accent/50 transition-colors"
              >
                Ver todas
              </button>
            </div>
          )}
        </div>
        <ThemeToggle collapsed={collapsed} />
        {isLoggedIn && (
          <button
            onClick={handleLogout}
            className={cn(
              "flex w-full items-center rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all hover:bg-red-500/10 hover:text-red-400",
              collapsed ? "justify-center" : "gap-3"
            )}
            title={collapsed ? "Cerrar sesión" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && "Cerrar sesión"}
          </button>
        )}
      </div>
    </div>
  );
}
