"use client";

import { useState, useEffect, use } from "react";
import { getUserProfile, getActivityHeatmap, getActivity, type User, type ActivityLog } from "@/lib/api";
import { Mail, Phone, Briefcase, FileText, Clock, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function UserProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [user, setUser] = useState<User | null>(null);
  const [heatmap, setHeatmap] = useState<Record<string, number>>({});
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getUserProfile(id),
      getActivityHeatmap(id, 90),
      getActivity({ userId: id, limit: 10 }),
    ])
      .then(([u, h, a]) => {
        setUser(u);
        setHeatmap(h);
        setRecentActivity(a.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Usuario no encontrado</p>
      </div>
    );
  }

  const initials = user.nombre
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const totalActions = Object.values(heatmap).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Link
          href="/config"
          className="flex h-8 w-8 items-center justify-center rounded-xl border border-border/60 text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Perfil de {user.nombre.split(" ")[0]}</h1>
          <p className="text-sm text-muted-foreground">Vista de perfil (solo lectura)</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-4 transition-shadow hover:shadow-md lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {user.avatarBase64 ? (
              <img
                src={user.avatarBase64}
                alt={user.nombre}
                className="h-24 w-24 rounded-2xl object-cover border-2 border-violet-500/20 shadow-lg"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white text-2xl font-bold shadow-lg shadow-violet-500/20">
                {initials}
              </div>
            )}
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-foreground">{user.nombre}</h2>
              {user.cargo && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> {user.cargo}
                </p>
              )}
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user.email}
              </p>
              {user.telefono && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> {user.telefono}
                </p>
              )}
              <span className="inline-block rounded-lg bg-violet-500/10 px-2 py-0.5 text-xs text-violet-500 font-medium capitalize">
                {user.rol.toLowerCase()}
              </span>
            </div>
          </div>
          {user.bio && (
            <div className="mt-4 pt-4 border-t border-border/40">
              <p className="text-sm text-muted-foreground flex items-start gap-1.5">
                <FileText className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {user.bio}
              </p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold text-foreground">Estadísticas</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted/20 p-3 text-center">
              <p className="text-2xl font-bold text-violet-500">{totalActions}</p>
              <p className="text-xs text-muted-foreground">Acciones (90d)</p>
            </div>
            <div className="rounded-xl bg-muted/20 p-3 text-center">
              <p className="text-2xl font-bold text-blue-500">
                {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString("es-CL") : "—"}
              </p>
              <p className="text-xs text-muted-foreground">Último login</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Miembro desde {user.createdAt ? new Date(user.createdAt).toLocaleDateString("es-CL") : "—"}
          </p>
        </div>

        {/* Recent activity */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold text-foreground">Actividad Reciente</h3>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin actividad registrada</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {recentActivity.map((a) => (
                <div key={a.id} className="flex items-start gap-2 rounded-lg p-2 hover:bg-accent/30 transition-colors">
                  <div className="mt-1 h-2 w-2 rounded-full bg-violet-500 shrink-0" />
                  <div>
                    <p className="text-xs text-foreground">{a.detalle || a.accion}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(a.createdAt).toLocaleDateString("es-CL")} · {new Date(a.createdAt).toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
