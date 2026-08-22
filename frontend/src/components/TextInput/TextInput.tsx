import type { InputHTMLAttributes } from "react";
import { Text } from "@/components/Text/Text";

export interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "id"> {
  id: string;
  label: string;
  error?: string;
}

export function TextInput({ id, label, error, className, ...inputProps }: TextInputProps) {
  const errorId = `${id}-error`;
  const borderClass = error === undefined ? "border-slate-300" : "border-red-500";

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>
        <Text variant="label">{label}</Text>
      </label>

      <input
        {...inputProps}
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        className={[
          "rounded-md border px-3 py-2 text-base text-slate-900",
          "focus:border-slate-500 focus:outline-none focus:ring-1 focus:ring-slate-500",
          "disabled:bg-slate-100 disabled:text-slate-500",
          borderClass,
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      />

      {error === undefined ? null : (
        <span id={errorId}>
          <Text variant="caption" tone="danger">
            {error}
          </Text>
        </span>
      )}
    </div>
  );
}
