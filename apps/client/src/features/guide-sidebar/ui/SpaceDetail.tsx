import { SPACES, STYLES, TITLE_ICON_SIZE } from "../model/space.constants";
import type { Space } from "../model/space.types";

interface SpaceDetailProps {
  spaceKey: Space;
}

const SpaceDetail = ({ spaceKey }: SpaceDetailProps) => {
  const space = SPACES[spaceKey];

  return (
    <div>
      <div className={STYLES.title}>
        <space.Icon size={TITLE_ICON_SIZE} />
        {space.title}
      </div>
      <p className="mb-3 text-sm font-medium text-gray-700">{space.description}</p>
      <img src={space.url} alt={`${space.title} 배치도`} className="mb-3 w-full rounded-lg border" />
      <ul className={STYLES.list}>
        {space.items.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
};

export default SpaceDetail;
