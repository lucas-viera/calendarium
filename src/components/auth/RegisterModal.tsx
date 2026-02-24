"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { register } from "@/lib/authClient";

function fieldClass() {
  return "w-full rounded-lg border border-black/15 bg-background px-3 py-2 text-sm outline-none focus:border-black/30";
}

export function RegisterModal(props: {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}) {
  const { open, onClose, onSuccess } = props;
  const router = useRouter();

  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]> | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors(null);

    if (password1 !== password2) {
      setFormError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      await register({ name, surname, email, password: password1 });
      onClose();
      setName("");
      setSurname("");
      setEmail("");
      setPassword1("");
      setPassword2("");
      onSuccess?.();
      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Error registrando usuario.";
      const details = (err as { details?: Record<string, string[]> }).details;
      setFormError(message);
      if (details) setFieldErrors(details);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal open={open} title="Crear cuenta" onClose={onClose}>
      <form className="space-y-3" onSubmit={onSubmit}>
        {formError ? (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm">
            {formError}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs font-medium">Nombre</label>
            <input
              className={fieldClass()}
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="given-name"
              required
            />
            {fieldErrors?.name?.[0] ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name[0]}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium">Apellido</label>
            <input
              className={fieldClass()}
              value={surname}
              onChange={(e) => setSurname(e.target.value)}
              autoComplete="family-name"
              required
            />
            {fieldErrors?.surname?.[0] ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.surname[0]}</p>
            ) : null}
          </div>
        </div>

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
            value={password1}
            onChange={(e) => setPassword1(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
          {fieldErrors?.password?.[0] ? (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.password[0]}</p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium">Repetir contraseña</label>
          <input
            className={fieldClass()}
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            type="password"
            autoComplete="new-password"
            required
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center rounded-full bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "Creando..." : "Crear cuenta"}
        </button>
      </form>
    </Modal>
  );
}