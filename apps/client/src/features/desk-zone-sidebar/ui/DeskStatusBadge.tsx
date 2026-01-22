import { DESK_STATUS_COLORS, DESK_STATUS_LABEL } from "../model/desk-status.constants";

import type { DeskStatus } from "@shared/types";

interface DeskStatusBadgeProps {
  status: DeskStatus | null;
}

export const DeskStatusBadge = ({ status }: DeskStatusBadgeProps) => {
  if (status === null) return null;

  const colors = DESK_STATUS_COLORS[status];
  const label = DESK_STATUS_LABEL[status];

  return (
    <span
      className={`inline-flex min-w-[20px] items-center justify-center rounded-full px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text}`}
    >
      {label}
    </span>
  );
};
