import { memo } from "react";

import { MAX_BADGE_COUNT } from "@shared/config";

interface SidebarTabBadgeProps {
  count: number;
  index: number;
}

export const SidebarTabBadge = memo(function SidebarTabBadge({ count, index }: SidebarTabBadgeProps) {
  if (count === 0) return null;

  return (
    <span
      className="pointer-events-none absolute flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white"
      style={{
        top: `${index * (48 + 16)}px`,
        right: "-4px",
      }}
    >
      {count > MAX_BADGE_COUNT ? `${MAX_BADGE_COUNT}+` : count}
    </span>
  );
});
