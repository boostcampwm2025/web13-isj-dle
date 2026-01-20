import { DESK_STATUS_COLORS, DESK_STATUS_LABEL } from "../model/desk-status.constants";

import type { DeskStatus } from "@shared/types";

interface MyStatusSelectorProps {
  currentStatus: DeskStatus | null;
  onStatusChange: (status: DeskStatus) => void;
}

const statusOrder: DeskStatus[] = ["available", "talking", "focusing"];

export const MyStatusSelector = ({ currentStatus, onStatusChange }: MyStatusSelectorProps) => {
  return (
    <div className="mt-2 flex gap-2">
      {statusOrder.map((status) => {
        const isActive = currentStatus === status;
        const colors = DESK_STATUS_COLORS[status];
        const label = DESK_STATUS_LABEL[status];

        return (
          <button
            key={status}
            onClick={() => onStatusChange(status)}
            className={`flex-1 rounded-lg border px-1 py-1.5 text-xs font-medium transition-colors ${
              isActive
                ? `${colors.activeBg} ${colors.activeBorder} text-white`
                : `${colors.border} ${colors.text} ${colors.hoverBg}`
            }`}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
};
