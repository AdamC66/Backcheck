export interface SegmentedControlOption<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
}

const BASE_SEGMENT =
  "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

const SELECTED_SEGMENT = "bg-white text-slate-900 shadow-sm";
const UNSELECTED_SEGMENT = "text-slate-600 hover:text-slate-900";
const DISABLED_SEGMENT = "cursor-not-allowed text-slate-300 hover:text-slate-300";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1 rounded-lg bg-slate-100 p-1">
      {options.map((option) => {
        const selected = option.value === value;
        const tone = option.disabled
          ? DISABLED_SEGMENT
          : selected
            ? SELECTED_SEGMENT
            : UNSELECTED_SEGMENT;

        return (
          <button
            key={option.value}
            type="button"
            // Not a tablist: these filter one panel rather than swapping between several.
            aria-pressed={selected}
            disabled={option.disabled}
            onClick={() => onChange(option.value)}
            className={`${BASE_SEGMENT} ${tone}`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
