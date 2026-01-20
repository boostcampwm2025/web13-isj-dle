import type { DeskStatus } from "@shared/types";

export const ICON_SIZE = 16;

export const DESK_STATUS_LABEL: Record<DeskStatus, string> = {
  available: "노크 가능",
  focusing: "집중 중",
  talking: "대화 중",
} as const;

export const DESK_STATUS_COLORS: Record<
  DeskStatus,
  { bg: string; text: string; border: string; hoverBg: string; activeBg: string; activeBorder: string }
> = {
  available: {
    bg: "bg-emerald-100",
    text: "text-emerald-700",
    border: "border-emerald-300",
    hoverBg: "hover:bg-emerald-50",
    activeBg: "bg-emerald-500",
    activeBorder: "border-emerald-500",
  },
  focusing: {
    bg: "bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-300",
    hoverBg: "hover:bg-rose-50",
    activeBg: "bg-rose-500",
    activeBorder: "border-rose-500",
  },
  talking: {
    bg: "bg-amber-100",
    text: "text-amber-700",
    border: "border-amber-300",
    hoverBg: "hover:bg-amber-50",
    activeBg: "bg-amber-500",
    activeBorder: "border-amber-500",
  },
} as const;
