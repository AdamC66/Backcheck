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
  /** Paints the selected segment in the surrounding team's colours. */
  themed?: boolean;
}

const BASE_SEGMENT =
  "cursor-pointer px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900";

const SELECTED_SEGMENT = "bg-white text-slate-900 shadow-sm";
const THEMED_SEGMENT = "bg-team-primary text-team-contrast shadow-sm";
const UNSELECTED_SEGMENT = "text-slate-600 hover:text-slate-900";
const DISABLED_SEGMENT = "cursor-not-allowed text-slate-300 hover:text-slate-300";

function segmentTone(selected: boolean, disabled: boolean, themed: boolean) {
  if (disabled) return DISABLED_SEGMENT;
  if (!selected) return UNSELECTED_SEGMENT;

  return themed ? THEMED_SEGMENT : SELECTED_SEGMENT;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  themed = false,
}: SegmentedControlProps<T>) {
  return (
    <div role="group" aria-label={label} className="inline-flex gap-1 bg-slate-100 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          // Not a tablist: these filter one panel rather than swapping between several.
          aria-pressed={option.value === value}
          disabled={option.disabled}
          onClick={() => onChange(option.value)}
          className={`${BASE_SEGMENT} ${segmentTone(option.value === value, option.disabled ?? false, themed)}`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
