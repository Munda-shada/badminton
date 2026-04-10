"use client";

import { useEffect, useRef, type ReactNode } from "react";

export function ClubModal({
  open,
  onClose,
  labelledBy,
  children,
}: {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    if (open) {
      if (!el.open) {
        el.showModal();
      }
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }

    const onCancel = (event: Event) => {
      event.preventDefault();
      onClose();
    };

    el.addEventListener("cancel", onCancel);
    return () => el.removeEventListener("cancel", onCancel);
  }, [onClose]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      className="dialog-sheet"
      onClose={onClose}
    >
      <div className="dialog-card">{children}</div>
    </dialog>
  );
}
