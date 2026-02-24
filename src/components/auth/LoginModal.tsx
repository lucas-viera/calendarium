"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { login, LoginResponse } from "@/lib/authClient";

function fieldClass() {
  return "w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-sm outline-none focus:border-black/30";
}

export function LoginModal(props: {
  open: boolean;
  onClose: () => void;
  onLoggedIn?: (user: LoginResponse) => void;
}) {
  const { open, onClose, onLoggedIn } = props;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    setLoading(true);
    try {
      const user = await login({ email, password });
      onLoggedIn?.(user);
      onClose();
      setEmail("");
      setPassword("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error iniciando sesión.";
      const details = (err as { details?: Record<string, string[]> }).details;
      setFormError(message);
      if (details) setFieldErrors(details);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="Ingresar" onClose={onClose}>
      <form className="space-y-3" onSubmit={onSubmit}>
        {formError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
            {formError}
          </div>
        ) : null}

        <div>
          <label className="mb-1 block text-xs font-medium">Email</label>
          <input
            className={fieldClass()}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            autoComplete="email"
            required
          />
          {fieldErrors?.email?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.email[0]}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Contraseña</label>
          <input
            className={fieldClass()}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            autoComplete="current-password"
            required
          />
          {fieldErrors?.password?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full border border-black/15 bg-background px-5 py-2.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
        >
          {loading ? "Ingresando..." : "Ingresar"}
        </button>
      </form>
    </Modal>
  );
}