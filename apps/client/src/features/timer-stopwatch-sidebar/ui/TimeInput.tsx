import { useRef, useState } from "react";

interface TimeInputProps {
  value: number;
  onChange: (v: number) => void;
  max: number;
  editable?: boolean;
  isWarning?: boolean;
}

export const TimeInput = ({ value, onChange, max, editable = false, isWarning = false }: TimeInputProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [localValue, setLocalValue] = useState<string>("");
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replaceAll(/\D/g, "").slice(0, 2);
    setLocalValue(raw);
    const num = Math.min(max, Math.max(0, Number(raw) || 0));
    onChange(num);
  };

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value === 0 ? "" : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    setLocalValue("");
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
      readOnly={!editable}
      className={`h-10 w-14 translate-y-0.5 bg-transparent text-center font-mono text-3xl font-semibold outline-none ${textColor} ${editable ? "cursor-text focus:rounded-md focus:border focus:border-blue-500" : "cursor-default"}`}
    />
  );
};
