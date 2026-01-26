import { MODES, MODE_LABELS, type Mode } from "../model/meeting.constants";

import { useState } from "react";

const MeetingSidebar = () => {
  const [mode, setMode] = useState<Mode>("daily_scrum");

  const activeIndex = MODES.indexOf(mode);
  const widthPercent = 100 / MODES.length;

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="mb-4 rounded-full bg-gray-100 p-1">
        <div className="relative flex">
          <div
            className="absolute top-0 h-full rounded-full bg-white shadow transition-transform duration-200"
            style={{
              width: `${widthPercent}%`,
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
          {MODES.map((modeItem) => (
            <button
              key={modeItem}
              onClick={() => setMode(modeItem)}
              className="relative z-10 flex-1 cursor-pointer py-1.5 text-sm text-gray-700"
            >
              {MODE_LABELS[modeItem].title}
            </button>
          ))}
        </div>
      </div>

      {MODES.map((modeItem) => {
        const PanelComponent = MODE_LABELS[modeItem].Panel;

        return (
          <div
            key={modeItem}
            className="scrollbar-hide flex-1 overflow-y-auto"
            style={{ display: mode === modeItem ? "block" : "none" }}
          >
            <PanelComponent />
          </div>
        );
      })}
    </div>
  );
};

export default MeetingSidebar;
