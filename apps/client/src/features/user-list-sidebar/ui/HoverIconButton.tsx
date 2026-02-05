import { useRef, useState } from "react";

import { ICON_SIZE } from "@shared/config";

import type { LucideIcon } from "lucide-react";

interface HoverButtonProps {
  title: string;
  Icon: LucideIcon;
  color?: string;
  onClick: () => void;
}

const HoverIconButton = ({ title, Icon, color = "black", onClick }: HoverButtonProps) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div
      ref={anchorRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Icon color={color} size={ICON_SIZE} className="cursor-pointer" onClick={onClick} />

      {open && (
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 -translate-y-[150%] rounded-md bg-black px-2 py-1 text-xs whitespace-nowrap text-white opacity-90">
          {title}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black" />
        </div>
      )}
    </div>
  );
};

export default HoverIconButton;
