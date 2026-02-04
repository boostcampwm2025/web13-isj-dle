import { STYLES, TITLE_ICON_SIZE } from "../model/space.constants";
import { Gamepad2 } from "lucide-react";

const Controls = () => {
  return (
    <div>
      <div className={STYLES.title}>
        <Gamepad2 size={TITLE_ICON_SIZE} />
        기본 조작
      </div>
      <ul className={STYLES.list}>
        <li>WASD / 방향키로 이동</li>
        <li>Shift 키로 달리기</li>
        <li>E 키로 의자·오브젝트 상호작용</li>
        <li>마우스 휠로 화면 확대/축소</li>
        <li>다른 공간에 있는 아바타는 보이지 않음(사용자 목록에서 위치 확인 가능)</li>
      </ul>
    </div>
  );
};

export default Controls;
