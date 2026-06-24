import { cn } from "@/lib/utils";

/** A round color swatch backed by a native color picker. */
export function ColorInput({
  value,
  onChange,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  label: string;
  className?: string;
}) {
  return (
    <input
      type="color"
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        "size-7 shrink-0 cursor-pointer appearance-none rounded-full border bg-transparent p-0",
        // Make the native swatch fill the circular control across browsers.
        "[&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none",
        "[&::-webkit-color-swatch-wrapper]:rounded-full [&::-webkit-color-swatch-wrapper]:p-0",
        "[&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none",
        className,
      )}
    />
  );
}
