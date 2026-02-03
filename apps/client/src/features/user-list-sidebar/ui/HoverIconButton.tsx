import type { LucideIcon } from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import { ICON_SIZE } from "@shared/config";

interface HoverButtonProps {
  title: string;
  Icon: LucideIcon;
  color?: string;
  onClick: () => void;
}

const HoverIconButton = ({ title, Icon, color = "black", onClick }: HoverButtonProps) => {
  const anchorRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ left: number; top: number }>({ left: 0, top: 0 });

  const updatePos = () => {
    const el = anchorRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      left: r.left + r.width / 2,
      top: r.top - 12, // 아이콘 위쪽
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePos();
    window.addEventListener("scroll", updatePos, true);
    window.addEventListener("resize", updatePos);
    return () => {
      window.removeEventListener("scroll", updatePos, true);
      window.removeEventListener("resize", updatePos);
    };
  }, [open]);

  return (
    <div
      ref={anchorRef}
      className="relative inline-flex"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <Icon color={color} size={ICON_SIZE} className="cursor-pointer" onClick={onClick} />

      {open &&
        createPortal(
          <div
            className="pointer-events-none fixed -translate-x-1/2 -translate-y-full rounded-md bg-black px-2 py-1 text-xs whitespace-nowrap text-white opacity-90"
            style={{ left: pos.left, top: pos.top }}
          >
            {title}
            <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-black" />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default HoverIconButton;
