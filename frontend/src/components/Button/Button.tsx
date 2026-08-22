import type { ButtonHTMLAttributes, ReactNode } from "react";

const VARIANT_CLASS = {
  primary: "bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400",
  secondary:
    "border border-slate-300 text-slate-700 hover:bg-slate-100 disabled:text-slate-400 disabled:hover:bg-transparent",
  danger: "bg-red-600 text-white hover:bg-red-500 disabled:bg-red-300",
} as const;

const SIZE_CLASS = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-base",
} as const;

export type ButtonVariant = keyof typeof VARIANT_CLASS;
export type ButtonSize = keyof typeof SIZE_CLASS;

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
}

// `type` is required rather than defaulted: an un-typed button inside a form submits it,
// which is the wrong default often enough to be worth making explicit at every call site.
export function Button({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...buttonProps
}: ButtonProps) {
  const classes = [
    "rounded-md font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900",
    VARIANT_CLASS[variant],
    SIZE_CLASS[size],
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button {...buttonProps} className={classes}>
      {children}
    </button>
  );
}
