import type { ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

export function Button({ className, variant = "primary", ...props }: ButtonProps) {
  const variantClassName =
    variant === "secondary"
      ? "secondary-button"
      : variant === "ghost"
        ? "ghost-button"
        : "primary-button";

  return <button className={cn(variantClassName, className)} {...props} />;
}
