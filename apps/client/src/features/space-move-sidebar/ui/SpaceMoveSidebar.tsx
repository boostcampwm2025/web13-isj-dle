import { MOVE_ROOM_MAP } from "../model/space-move.constants";
import type { MovableRoom } from "../model/space-move.types";
import { useSpaceMove } from "../model/use-space-move";

import { ICON_SIZE } from "@shared/config";

const SpaceMoveSidebar = () => {
  const { handleMoveSpace } = useSpaceMove();

  return (
    <div className="flex h-full w-full flex-col bg-white">
      <div className="scrollbar-hide flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
        {Object.entries(MOVE_ROOM_MAP).map(([room, { name, icon: IconComponent }]) => (
          <button
            key={room}
            onClick={() => handleMoveSpace(room as MovableRoom)}
            title={name}
            className="group flex w-full items-center gap-3 rounded-xl border border-gray-200 bg-white px-3 py-2 text-left transition hover:border-gray-300 hover:bg-gray-50 active:scale-[0.99]"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-700 group-hover:bg-gray-200">
              <IconComponent size={ICON_SIZE} />
            </span>
            <span className="flex-1 truncate text-sm font-medium text-gray-900">{name}</span>
          </button>
        ))}
      </div>

      <div className="border-t border-gray-200 px-3 py-2 text-xs text-gray-500">
        버튼을 누르면 문 앞까지 자동 이동합니다.
      </div>
    </div>
  );
};

export default SpaceMoveSidebar;
