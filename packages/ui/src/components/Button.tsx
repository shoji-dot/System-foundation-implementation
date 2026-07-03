import { forwardRef } from "react";
import type { ButtonHTMLAttributes } from "react";

/**
 * 設計書⑭ デザインシステム準拠のButton。彩色はアクセント1色のみ、44pxタップ領域を確保。
 */
export type ButtonVariant = "primary" | "secondary" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const VARIANT_CLASS_NAME: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "bg-surface text-text border border-border hover:opacity-80",
  danger: "bg-danger text-white hover:opacity-90",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "primary", className = "", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={[
        "inline-flex min-h-[44px] items-center justify-center rounded-sm px-4 text-[16px] font-medium",
        "transition-opacity duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "disabled:cursor-not-allowed disabled:opacity-40",
        VARIANT_CLASS_NAME[variant],
        className,
      ].join(" ")}
      {...props}
    />
  );
});
