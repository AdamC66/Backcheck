import type { ToastItem } from "@/toast/toastContext";

export interface ToastViewportProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

const TONE_CLASS: Record<ToastItem["tone"], string> = {
  success: "border-emerald-600 bg-emerald-50 text-emerald-900",
  error: "border-red-600 bg-red-50 text-red-900",
  info: "border-slate-300 bg-white text-slate-900",
};

export function ToastViewport({ toasts, onDismiss }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-4 bottom-4 z-50 flex w-full max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="alert"
          className={`flex items-start justify-between gap-3 border px-4 py-3 shadow-lg ${TONE_CLASS[toast.tone]}`}
        >
          <span className="text-sm font-medium">{toast.message}</span>
          <button
            type="button"
            onClick={() => onDismiss(toast.id)}
            aria-label="Dismiss"
            className="shrink-0 cursor-pointer text-lg leading-none opacity-60 hover:opacity-100"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
