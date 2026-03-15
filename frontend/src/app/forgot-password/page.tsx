"use client";

import { useState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/api";
import { Mail, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al enviar el correo");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      </div>

      <div className="relative w-full max-w-sm space-y-8 animate-fade-in">
        <div className="text-center">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 shadow-lg shadow-violet-500/25">
            <span className="text-3xl font-bold text-white">PC</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Recuperar Contraseña</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Te enviaremos un enlace para restablecer tu contraseña
          </p>
        </div>

        {sent ? (
          <div className="glass rounded-2xl border border-border/50 p-7 shadow-xl shadow-black/5 space-y-4 animate-scale-in">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="h-7 w-7 text-green-500" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">Correo Enviado</h2>
              <p className="text-sm text-muted-foreground">
                Si existe una cuenta con <span className="font-medium text-foreground">{email}</span>,
                recibirás un enlace para restablecer tu contraseña. Revisa tu bandeja de entrada.
              </p>
            </div>
            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 py-3 text-sm font-medium text-foreground hover:bg-accent/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass space-y-5 rounded-2xl border border-border/50 p-7 shadow-xl shadow-black/5">
            <div>
              <h2 className="text-lg font-semibold text-foreground">¿Olvidaste tu contraseña?</h2>
              <p className="text-xs text-muted-foreground">Ingresa tu email registrado</p>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm text-red-400 animate-scale-in">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@purocode.com"
                  className="w-full rounded-xl border border-input bg-background/80 py-3 pl-11 pr-4 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:shadow-xl hover:shadow-violet-500/30 hover:brightness-110 disabled:opacity-50 disabled:shadow-none"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Enviando...
                </>
              ) : (
                "Enviar enlace de recuperación"
              )}
            </button>

            <Link
              href="/login"
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/60 py-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent/50 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al Login
            </Link>
          </form>
        )}

        <p className="text-center text-xs text-muted-foreground">
          PuroCode © {new Date().getFullYear()}
        </p>
      </div>
    </div>
  );
}
