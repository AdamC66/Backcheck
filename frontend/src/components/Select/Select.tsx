import type { SelectHTMLAttributes } from "react";
import { Text } from "@/components/Text/Text";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "id"> {
  id: string;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export function Select({
  id,
  label,
  options,
  placeholder,
  error,
  className,
  ...selectProps
}: SelectProps) {
  const errorId = `${id}-error`;
  const borderClass = error === undefined ? "border-slate-300" : "border-red-500";

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id}>
        <Text variant="label">{label}</Text>
      </label>

      <select
        {...selectProps}
        id={id}
        aria-invalid={error !== undefined}
        aria-describedby={error === undefined ? undefined : errorId}
        className={[
          "border bg-white px-3 py-2 text-base text-slate-900",
          "focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none",
          "disabled:bg-slate-100 disabled:text-slate-500",
          borderClass,
          className ?? "",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {placeholder === undefined ? null : <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

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
