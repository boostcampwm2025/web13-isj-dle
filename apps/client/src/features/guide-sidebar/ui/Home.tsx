import MenuButton from "./MenuButton";
import { Bug, Gamepad2, Map, Monitor } from "lucide-react";

interface HomeProps {
  addPath: (subPath: string) => void;
}

const Home = ({ addPath }: HomeProps) => {
  return (
    <div className="space-y-3">
      <MenuButton Icon={Gamepad2} title="기본 조작" onClick={() => addPath("controls")} />
      <MenuButton Icon={Monitor} title="화면 조작" onClick={() => addPath("layout")} />
      <MenuButton Icon={Map} title="공간별 기능" onClick={() => addPath("spaces")} />
      <MenuButton Icon={Bug} title="오류 신고" onClick={() => addPath("report")} />
    </div>
  );
};

export default Home;
