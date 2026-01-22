import { SPACES, STYLES, SUB_ICON_SIZE } from "../model/space.constants";
import type { Space } from "../model/space.types";

import { useState } from "react";

const SpaceLayout = () => {
  const [currentSpace, setCurrentSpace] = useState<Space | null>(null);

  return (
    <>
      {Object.entries(SPACES).map(([key, { url, Icon, title, description, items }]) => {
        if (key === "world") return null;
        return (
          <div key={key} className="mt-3">
            <div
              className="mb-1 flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-600"
              onClick={() => setCurrentSpace(key === currentSpace ? null : (key as Space))}
            >
              {currentSpace === key ? "▼" : "▶"} <Icon size={SUB_ICON_SIZE} /> {title}
            </div>
            {currentSpace === key && (
              <>
                <div className="my-1 text-sm font-bold text-gray-700">{description}</div>
                <img src={url} alt={`${title} 배치도`} className="w-full rounded-lg border" />
                <ul className={`mt-3 ${STYLES.list}`}>
                  {items.map((it, idx) => (
                    <li key={idx}>{it}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );
      })}
    </>
  );
};

export default SpaceLayout;
