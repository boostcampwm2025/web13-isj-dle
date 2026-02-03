import { useRef, useState } from "react";

interface TimeInputProps {
  value: number;
  onChange: (v: number) => void;
  onCommit?: () => void;
  max: number;
  allowOverflow?: boolean;
  overflowBase?: number;
  editable?: boolean;
  isWarning?: boolean;
}

export const TimeInput = ({
  value,
  onChange,
  onCommit,
  max,
  allowOverflow = false,
  overflowBase,
  editable = false,
  isWarning = false,
}: TimeInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replaceAll(/\D/g, "").slice(0, 2);
    const num = Math.max(0, Number(raw) || 0);

    if (!allowOverflow) {
      setLocalValue(raw);
      onChange(Math.min(max, num));
      return;
    }

    const base = overflowBase ?? max + 1;
    const displayNum = num >= base ? num % base : num;
    setLocalValue(raw === "" ? "" : String(displayNum));
    onChange(num);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value === 0 ? "" : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    setLocalValue("");
    onCommit?.();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.currentTarget.blur();
    }
  };

  const displayValue = value.toString().padStart(2, "0");
  const textColor = isWarning ? "text-red-500" : "text-gray-900";

  const isEditing = editable && isFocused;
  const showValue = isEditing ? localValue : displayValue;

  return (
    <input
      ref={inputRef}
      type="text"
      inputMode="numeric"
      value={showValue}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      readOnly={!editable}
      className={`h-10 w-14 translate-y-0.5 bg-transparent text-center font-mono text-3xl font-semibold outline-none ${textColor} ${editable ? "cursor-text focus:rounded-md focus:border focus:border-blue-500" : "cursor-default"}`}
    />
  );
};
