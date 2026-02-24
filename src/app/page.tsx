"use client";

import React, { useState } from "react";
import { RegisterModal } from "@/components/auth/RegisterModal";
import { LoginModal } from "@/components/auth/LoginModal";
import type { LoginResponse } from "@/lib/authClient";

export default function Home() {
  const [registerOpen, setRegisterOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);
  const [user, setUser] = useState<LoginResponse | null>(null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <div className="text-lg font-semibold tracking-tight">Calendarium</div>
        <div className="flex items-center gap-3">
          <button
            className="rounded-full border border-black/15 px-4 py-2 text-sm hover:bg-black/5"
            onClick={() => setLoginOpen(true)}
          >
            Ingresar
          </button>
          <button
            className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
            onClick={() => setRegisterOpen(true)}
          >
            Registrarse
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-10 px-6 py-16 md:grid-cols-2 md:items-center">
        <section className="space-y-4">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight">
            Organiza tu vida con un calendario simple.
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">
            Crea tu cuenta o ingresa para empezar a usar Calendarium.
          </p>

          {user ? (
            <div className="rounded-xl border border-black/10 bg-black/5 px-4 py-3 text-sm">
              Sesión iniciada como <span className="font-medium">{user.email}</span>
            </div>
          ) : null}
        </section>

        <section className="rounded-2xl border border-black/10 bg-white/40 p-6 shadow-sm dark:bg-black/20">
          <h2 className="text-base font-semibold">Empieza ahora</h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Registro rápido y login con email + contraseña.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <button
              className="rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background hover:opacity-90"
              onClick={() => setRegisterOpen(true)}
            >
              Crear cuenta
            </button>
            <button
              className="rounded-full border border-black/15 px-5 py-3 text-sm hover:bg-black/5"
              onClick={() => setLoginOpen(true)}
            >
              Ya tengo cuenta
            </button>
          </div>
        </section>
      </main>

      <RegisterModal
        open={registerOpen}
        onClose={() => setRegisterOpen(false)}
        onSuccess={() => {
          // acá después podrías redirigir a /dashboard
        }}
      />

      <LoginModal
        open={loginOpen}
        onClose={() => setLoginOpen(false)}
        onLoggedIn={(u) => setUser(u)}
      />
    </div>
  );
}