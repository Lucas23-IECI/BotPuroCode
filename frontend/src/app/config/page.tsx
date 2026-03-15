"use client";

import { useState, useEffect } from "react";
import {
  changePassword,
  getUsers,
  seedPlantillas,
  type User,
} from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  Settings,
  Lock,
  Users,
  Sparkles,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

export default function ConfigPage() {
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("botpurocode_user");
      if (stored) setCurrentUser(JSON.parse(stored));
    } catch {}
    getUsers().then(setUsers).catch(() => {});
  }, []);

  const handleChangePassword = async () => {
    if (newPassword.length < 6) {
      toast("La contraseña debe tener al menos 6 caracteres", "error");
      return;
    }
    setChangingPw(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast("Contraseña actualizada", "success");
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al cambiar contraseña", "error");
    } finally {
      setChangingPw(false);
    }
  };

  const handleSeedPlantillas = async () => {
    setSeeding(true);
    try {
      await seedPlantillas();
      toast("Plantillas predeterminadas cargadas", "success");
    } catch {
      toast("Error al cargar plantillas", "error");
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configuración</h1>
        <p className="text-sm text-muted-foreground">Cuenta y ajustes del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Profile card */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-blue-600 text-white text-lg font-bold shadow-md shadow-violet-500/20">
              {currentUser?.nombre?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{currentUser?.nombre ?? "Usuario"}</h2>
              <p className="text-xs text-muted-foreground">{currentUser?.email ?? ""}</p>
              <span className="text-xs text-violet-500 capitalize">{currentUser?.rol?.toLowerCase() ?? "usuario"}</span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-foreground">Cambiar Contraseña</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nueva contraseña</label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleChangePassword}
              disabled={!currentPassword || !newPassword || changingPw}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {changingPw ? "Actualizando…" : "Actualizar Contraseña"}
            </button>
          </div>
        </div>

        {/* Team members */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-foreground">Equipo</h3>
          </div>
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin usuarios registrados</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 p-3 transition-colors hover:bg-accent/50">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 text-xs font-bold">
                    {u.nombre.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{u.nombre}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                  <span className="text-xs text-muted-foreground capitalize">{u.rol.toLowerCase()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-foreground">Acciones Rápidas</h3>
          </div>

          <div className="space-y-2">
            <button
              onClick={handleSeedPlantillas}
              disabled={seeding}
              className="flex w-full items-center gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm text-foreground hover:bg-accent/50 transition-all disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4 text-amber-400" />
              {seeding ? "Cargando…" : "Cargar plantillas predeterminadas"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
