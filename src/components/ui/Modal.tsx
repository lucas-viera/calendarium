"use client";

import React, { useEffect, useMemo, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export function Modal(props: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  
}) {
  const { open, title, children, onClose } = props;

  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );  
  useEffect(() => {
    if (!open) return;
    
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);
  
  const modal = useMemo(() => {
    if (!open) return null;
    
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="w-full max-w-md rounded-2xl bg-background text-foreground shadow-xl ring-1 ring-black/10">
          <div className="flex items-center justify-between gap-4 border-b border-black/10 px-5 py-4">
            <h2 className="text-base font-semibold">{title}</h2>
            <button
              type="button"
              className="rounded-md px-2 py-1 text-sm hover:bg-black/5"
              onClick={onClose}
            >
              Cerrar
            </button>
          </div>
          <div className="px-5 py-4">{children}</div>
        </div>
      </div>
    )
  }, [open, title, children, onClose]);

  if (!isClient) return null;

  return modal ? createPortal(modal, document.body) : null;
  
}