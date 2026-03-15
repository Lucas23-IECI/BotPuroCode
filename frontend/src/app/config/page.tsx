"use client";

import { useState, useEffect } from "react";
import {
  getUsers,
  registerUser,
  updateUser,
  seedPlantillas,
  seedAdmin,
  type User,
} from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  Settings,
  Users,
  Sparkles,
  UserPlus,
  Shield,
  Power,
  Eye,
  EyeOff,
  Database,
} from "lucide-react";
import Link from "next/link";

export default function ConfigPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [seeding, setSeeding] = useState(false);
  const [seedingUsers, setSeedingUsers] = useState(false);

  // New user form
  const [showNewUser, setShowNewUser] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newNombre, setNewNombre] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRol, setNewRol] = useState<"ADMIN" | "VENDEDOR">("VENDEDOR");
  const [showNewPw, setShowNewPw] = useState(false);
  const [creating, setCreating] = useState(false);

  const loadUsers = () => getUsers().then(setUsers).catch(() => {});

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreateUser = async () => {
    if (!newEmail || !newNombre || newPassword.length < 6) {
      toast("Completa todos los campos (contraseña mín 6 chars)", "error");
      return;
    }
    setCreating(true);
    try {
      await registerUser({ email: newEmail, nombre: newNombre, password: newPassword, rol: newRol });
      toast("Usuario creado", "success");
      setShowNewUser(false);
      setNewEmail("");
      setNewNombre("");
      setNewPassword("");
      setNewRol("VENDEDOR");
      loadUsers();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al crear usuario", "error");
    } finally {
      setCreating(false);
    }
  };

  const handleToggleActive = async (u: User) => {
    try {
      await updateUser(u.id, { activo: !u.activo });
      toast(`Usuario ${u.activo ? "desactivado" : "activado"}`, "success");
      loadUsers();
    } catch {
      toast("Error al actualizar usuario", "error");
    }
  };

  const handleToggleRole = async (u: User) => {
    const newRol = u.rol === "ADMIN" ? "VENDEDOR" : "ADMIN";
    try {
      await updateUser(u.id, { rol: newRol } as Partial<User>);
      toast(`Rol cambiado a ${newRol}`, "success");
      loadUsers();
    } catch {
      toast("Error al cambiar rol", "error");
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

  const handleSeedUsers = async () => {
    setSeedingUsers(true);
    try {
      await seedAdmin();
      toast("Equipo inicial creado", "success");
      loadUsers();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al crear equipo", "error");
    } finally {
      setSeedingUsers(false);
    }
  };

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Panel de Administración</h1>
        <p className="text-sm text-muted-foreground">Gestión de usuarios y configuración del sistema</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Team management */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md lg:col-span-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-violet-500" />
              <h3 className="text-sm font-semibold text-foreground">Gestión de Equipo</h3>
              <span className="rounded-lg bg-violet-500/10 px-2 py-0.5 text-xs text-violet-500 font-medium">{users.length}</span>
            </div>
            <button
              onClick={() => setShowNewUser(!showNewUser)}
              className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-3 py-2 text-xs font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-lg transition-all"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Nuevo Usuario
            </button>
          </div>

          {/* New user form */}
          {showNewUser && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4 space-y-3 animate-scale-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre</label>
                  <input
                    type="text"
                    value={newNombre}
                    onChange={(e) => setNewNombre(e.target.value)}
                    placeholder="Nombre completo"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Email</label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="email@purocode.com"
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Contraseña</label>
                  <div className="relative">
                    <input
                      type={showNewPw ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Mín 6 caracteres"
                      className="w-full rounded-xl border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPw(!showNewPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">Rol</label>
                  <select
                    value={newRol}
                    onChange={(e) => setNewRol(e.target.value as "ADMIN" | "VENDEDOR")}
                    className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground"
                  >
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateUser}
                  disabled={creating}
                  className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2 text-xs font-medium text-white shadow-md shadow-violet-500/20 disabled:opacity-50"
                >
                  {creating ? "Creando…" : "Crear Usuario"}
                </button>
                <button
                  onClick={() => setShowNewUser(false)}
                  className="rounded-xl border border-border/60 px-4 py-2 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Users list */}
          {users.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin usuarios registrados</p>
          ) : (
            <div className="space-y-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 rounded-xl border border-border/40 bg-muted/10 p-3 transition-colors hover:bg-accent/30"
                >
                  {u.avatarBase64 ? (
                    <img src={u.avatarBase64} alt="" className="h-10 w-10 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500 text-sm font-bold">
                      {u.nombre.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <Link href={`/perfil/${u.id}`} className="text-sm font-medium text-foreground hover:text-violet-500 transition-colors">
                      {u.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    {u.cargo && <p className="text-xs text-muted-foreground/70 truncate">{u.cargo}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleRole(u)}
                      title={`Cambiar rol (actual: ${u.rol})`}
                      className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium transition-colors ${
                        u.rol === "ADMIN"
                          ? "bg-violet-500/10 text-violet-500 hover:bg-violet-500/20"
                          : "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                      }`}
                    >
                      <Shield className="h-3 w-3" />
                      {u.rol.toLowerCase()}
                    </button>
                    <button
                      onClick={() => handleToggleActive(u)}
                      title={u.activo ? "Desactivar" : "Activar"}
                      className={`rounded-lg p-1.5 transition-colors ${
                        u.activo
                          ? "text-green-500 hover:bg-green-500/10"
                          : "text-red-400 hover:bg-red-500/10"
                      }`}
                    >
                      <Power className="h-4 w-4" />
                    </button>
                  </div>
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
            <button
              onClick={handleSeedUsers}
              disabled={seedingUsers}
              className="flex w-full items-center gap-2 rounded-xl border border-border/60 px-4 py-3 text-sm text-foreground hover:bg-accent/50 transition-all disabled:opacity-50"
            >
              <Database className="h-4 w-4 text-violet-400" />
              {seedingUsers ? "Cargando…" : "Seed equipo inicial"}
            </button>
          </div>
        </div>

        {/* System info */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-3 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-foreground">Sistema</h3>
          </div>
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Versión: BotPuroCode v2.0</p>
            <p>Usuarios activos: {users.filter((u) => u.activo).length}</p>
            <p>Total usuarios: {users.length}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
