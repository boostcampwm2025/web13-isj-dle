import type { DeskStatus } from "@shared/types";

interface MyStatusSelectorProps {
  currentStatus: DeskStatus | null;
  onStatusChange: (status: DeskStatus) => void;
}

const statusOptions: { status: DeskStatus; label: string; color: string; activeColor: string }[] = [
  {
    status: "available",
    label: "노크 가능",
    color: "border-emerald-300 text-emerald-700 hover:bg-emerald-50",
    activeColor: "bg-emerald-500 text-white border-emerald-500",
  },
  {
    status: "talking",
    label: "대화 중",
    color: "border-amber-300 text-amber-700 hover:bg-amber-50",
    activeColor: "bg-amber-500 text-white border-amber-500",
  },
  {
    status: "focusing",
    label: "집중 중",
    color: "border-rose-300 text-rose-700 hover:bg-rose-50",
    activeColor: "bg-rose-500 text-white border-rose-500",
  },
];

export const MyStatusSelector = ({ currentStatus, onStatusChange }: MyStatusSelectorProps) => {
  return (
    <div className="mt-2 flex gap-2">
      {statusOptions.map((option) => {
        const isActive = currentStatus === option.status;
        return (
          <button
            key={option.status}
            onClick={() => onStatusChange(option.status)}
            className={`flex-1 rounded-lg border px-1 py-1.5 text-xs font-medium transition-colors ${
              isActive ? option.activeColor : option.color
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
};
