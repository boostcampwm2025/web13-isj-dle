import { SUB_ICON_SIZE } from "../model/space.constants";
import { ChevronRight, type LucideIcon } from "lucide-react";

import { TIMER_ICON_SIZE } from "@features/timer-stopwatch-sidebar";

interface MenuButtonProps {
  Icon: LucideIcon;
  title: string;
  description?: string;
  onClick: () => void;
}

const MenuButton = ({ Icon, title, description, onClick }: MenuButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center justify-between rounded-lg border border-gray-300 bg-white p-3 text-left transition-all hover:border-blue-500 hover:bg-blue-50"
    >
      <div className="flex items-center gap-3">
        <Icon size={TIMER_ICON_SIZE} className="text-blue-600" />
        <div>
          <div className="font-medium text-gray-800">{title}</div>
          {description && <div className="text-xs text-gray-500">{description}</div>}
        </div>
      </div>
      <ChevronRight size={SUB_ICON_SIZE} className="text-gray-400" />
    </button>
  );
};

export default MenuButton;
