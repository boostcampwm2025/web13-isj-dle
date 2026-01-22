import { DESK_STATUS_COLORS, DESK_STATUS_LABEL } from "../model/desk-status.constants";

import type { DeskStatus } from "@shared/types";

interface MyStatusSelectorProps {
  currentStatus: DeskStatus | null;
  onStatusChange: (status: DeskStatus) => void;
  isTalking?: boolean;
}

const statusOrder: DeskStatus[] = ["available", "talking", "focusing"];

export const MyStatusSelector = ({ currentStatus, onStatusChange, isTalking = false }: MyStatusSelectorProps) => {
  return (
    <div className="mt-2 flex gap-2">
      {statusOrder.map((status) => {
        const isActive = currentStatus === status;
        const colors = DESK_STATUS_COLORS[status];
        const label = DESK_STATUS_LABEL[status];
        const isTalkingButton = status === "talking";
        const isDisabled = isTalkingButton && !isTalking;

        return (
          <div key={status} className="relative flex-1">
            <button
              onClick={() => !isDisabled && onStatusChange(status)}
              disabled={isDisabled}
              title={isDisabled ? "화상회의 연결 중에만 활성화됩니다" : undefined}
              className={`w-full rounded-lg border px-1 py-1.5 text-xs font-medium transition-colors ${
                isDisabled
                  ? "cursor-not-allowed border-gray-200 bg-gray-100 text-gray-400"
                  : isActive
                    ? `${colors.activeBg} ${colors.activeBorder} text-white`
                    : `${colors.border} ${colors.text} ${colors.hoverBg}`
              }`}
            >
              {label}
            </button>
          </div>
        );
      })}
    </div>
  );
};
