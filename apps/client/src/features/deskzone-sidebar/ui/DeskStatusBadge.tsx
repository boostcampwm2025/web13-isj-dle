import type { DeskStatus } from "@shared/types";

interface DeskStatusBadgeProps {
  status: DeskStatus | null;
}

const statusConfig: Record<DeskStatus, { bg: string; text: string; label: string }> = {
  available: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    label: "노크 가능",
  },
  focusing: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    label: "집중 중",
  },
  talking: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    label: "대화 중",
  },
};

export const DeskStatusBadge = ({ status }: DeskStatusBadgeProps) => {
  if (status === null) return null;

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${config.bg} ${config.text}`}
    >
      {config.label}
    </span>
  );
};
