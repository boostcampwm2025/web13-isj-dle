import { SPACES } from "../model/space.constants";
import MenuButton from "./MenuButton";

interface SpacesProps {
  addPath: (subPath: string) => void;
}

const Spaces = ({ addPath }: SpacesProps) => {
  return (
    <div>
      <h3 className="mb-4 text-base font-bold text-gray-800">공간 선택</h3>
      <img src="/assets/maps/world.png" alt="공간 배치도" className="mb-4 w-full rounded-lg border" />

      <div className="space-y-2">
        {Object.entries(SPACES).map(([key, { Icon, title, description }]) => (
          <MenuButton key={key} Icon={Icon} title={title} description={description} onClick={() => addPath(key)} />
        ))}
      </div>
    </div>
  );
};

export default Spaces;
