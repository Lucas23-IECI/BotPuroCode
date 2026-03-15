"use client";

import { useState, useEffect, useRef } from "react";
import {
  getMe,
  updateProfile,
  changePassword,
  type User,
} from "@/lib/api";
import { useToast } from "@/components/toast";
import {
  UserCircle,
  Lock,
  Camera,
  Save,
  Eye,
  EyeOff,
  Mail,
  Phone,
  Briefcase,
  FileText,
} from "lucide-react";

function resizeImage(file: File, maxSize = 400): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let w = img.width;
        let h = img.height;
        if (w > maxSize || h > maxSize) {
          if (w > h) { h = (h * maxSize) / w; w = maxSize; }
          else { w = (w * maxSize) / h; h = maxSize; }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function PerfilPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Profile fields
  const [nombre, setNombre] = useState("");
  const [cargo, setCargo] = useState("");
  const [bio, setBio] = useState("");
  const [telefono, setTelefono] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [newAvatar, setNewAvatar] = useState<string | null | undefined>(undefined);
  const [saving, setSaving] = useState(false);

  // Password
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPw, setChangingPw] = useState(false);

  useEffect(() => {
    getMe()
      .then((u) => {
        setUser(u);
        setNombre(u.nombre);
        setCargo(u.cargo ?? "");
        setBio(u.bio ?? "");
        setTelefono(u.telefono ?? "");
        setAvatarPreview(u.avatarBase64 ?? null);
      })
      .catch(() => toast("Error al cargar perfil", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast("Solo se permiten imágenes", "error");
      return;
    }
    try {
      const resized = await resizeImage(file);
      setAvatarPreview(resized);
      setNewAvatar(resized);
    } catch {
      toast("Error al procesar imagen", "error");
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setNewAvatar(null);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const data: Record<string, string | null | undefined> = {};
      if (nombre !== user?.nombre) data.nombre = nombre;
      if (cargo !== (user?.cargo ?? "")) data.cargo = cargo || null;
      if (bio !== (user?.bio ?? "")) data.bio = bio || null;
      if (telefono !== (user?.telefono ?? "")) data.telefono = telefono || null;
      if (newAvatar !== undefined) data.avatarBase64 = newAvatar;

      if (Object.keys(data).length === 0) {
        toast("No hay cambios", "info");
        setSaving(false);
        return;
      }

      const updated = await updateProfile(data as Parameters<typeof updateProfile>[0]);
      setUser((prev) => prev ? { ...prev, ...updated } : prev);
      setNewAvatar(undefined);

      // Update localStorage so sidebar gets the new data
      const stored = localStorage.getItem("botpurocode_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("botpurocode_user", JSON.stringify({ ...parsed, ...updated }));
      }

      toast("Perfil actualizado", "success");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error al guardar", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPw.length < 6) {
      toast("Mínimo 6 caracteres", "error");
      return;
    }
    setChangingPw(true);
    try {
      await changePassword(currentPw, newPw);
      toast("Contraseña actualizada", "success");
      setCurrentPw("");
      setNewPw("");

      // Clear mustChangePassword flag in localStorage
      const stored = localStorage.getItem("botpurocode_user");
      if (stored) {
        const parsed = JSON.parse(stored);
        localStorage.setItem("botpurocode_user", JSON.stringify({ ...parsed, mustChangePassword: false }));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : "Error", "error");
    } finally {
      setChangingPw(false);
    }
  };

  const initials = nombre
    ? nombre.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "U";

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Mi Perfil</h1>
        <p className="text-sm text-muted-foreground">Información personal y seguridad</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Avatar & basic info */}
        <div className="rounded-2xl border border-border/60 bg-card p-6 space-y-5 transition-shadow hover:shadow-md lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Avatar */}
            <div className="relative group">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar"
                  className="h-24 w-24 rounded-2xl object-cover border-2 border-violet-500/20 shadow-lg"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 text-white text-2xl font-bold shadow-lg shadow-violet-500/20">
                  {initials}
                </div>
              )}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-xl bg-violet-600 text-white shadow-md hover:bg-violet-700 transition-colors"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 space-y-1">
              <h2 className="text-xl font-bold text-foreground">{user?.nombre}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {user?.email}
              </p>
              <p className="text-sm text-violet-500 capitalize">{user?.rol?.toLowerCase()}</p>
              {avatarPreview && (
                <button
                  onClick={handleRemoveAvatar}
                  className="text-xs text-red-400 hover:text-red-300 mt-1 transition-colors"
                >
                  Quitar foto
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-foreground">Información Personal</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Nombre completo</label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Briefcase className="h-3 w-3" /> Cargo
              </label>
              <input
                type="text"
                value={cargo}
                onChange={(e) => setCargo(e.target.value)}
                placeholder="ej. Co-Fundador & Dev Lead"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <Phone className="h-3 w-3" /> Teléfono
              </label>
              <input
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="+56 9 1234 5678"
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all focus:ring-2 focus:ring-violet-500/30"
              />
            </div>

            <div>
              <label className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                <FileText className="h-3 w-3" /> Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="Cuéntanos sobre ti..."
                className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm text-foreground transition-all resize-none focus:ring-2 focus:ring-violet-500/30"
              />
              <p className="text-xs text-muted-foreground text-right">{bio.length}/500</p>
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-lg transition-all disabled:opacity-50"
            >
              <Save className="h-4 w-4" />
              {saving ? "Guardando…" : "Guardar Cambios"}
            </button>
          </div>
        </div>

        {/* Change Password */}
        <div className="rounded-2xl border border-border/60 bg-card p-5 space-y-4 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-violet-500" />
            <h3 className="text-sm font-semibold text-foreground">Cambiar Contraseña</h3>
          </div>

          {user?.mustChangePassword && (
            <div className="rounded-xl bg-amber-500/10 border border-amber-500/20 p-3">
              <p className="text-xs text-amber-400 font-medium">
                ⚠️ Te recomendamos cambiar tu contraseña temporal
              </p>
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Contraseña actual</label>
              <div className="relative">
                <input
                  type={showCurrent ? "text" : "password"}
                  value={currentPw}
                  onChange={(e) => setCurrentPw(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2.5 pr-10 text-sm text-foreground transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
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
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
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
              disabled={!currentPw || !newPw || changingPw}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-violet-500/20 hover:shadow-lg transition-all disabled:opacity-50"
            >
              {changingPw ? "Actualizando…" : "Actualizar Contraseña"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
