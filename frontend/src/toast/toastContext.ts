import { createContext } from "react";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  message: string;
  tone: ToastTone;
}

export interface ToastContextValue {
  showToast: (message: string, tone?: ToastTone) => void;
}

// Lives apart from ToastProvider so that file can export only its component —
// react-refresh can't hot-reload a module that mixes components with other values.
export const ToastContext = createContext<ToastContextValue | null>(null);
