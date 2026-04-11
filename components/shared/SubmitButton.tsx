"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

import { cn } from "@/lib/utils";

type SubmitButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pendingLabel: string;
};

export function SubmitButton({ children, className, pendingLabel, disabled, type, ...rest }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      className={cn(className)}
      disabled={disabled || pending}
      type={type ?? "submit"}
      {...rest}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
