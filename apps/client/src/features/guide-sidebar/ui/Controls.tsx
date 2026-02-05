import { STYLES, TITLE_ICON_SIZE } from "../model/space.constants";
import { CircleDashed, Gamepad2 } from "lucide-react";

const Controls = () => {
  return (
    <div className="flex flex-col gap-8">
      <section>
        <div className={STYLES.title}>
          <Gamepad2 size={TITLE_ICON_SIZE} />
          기본 조작
        </div>
        <ul className={STYLES.list}>
          <li>WASD / 방향키로 이동</li>
          <li>Shift 키로 달리기</li>
          <li>E 키로 의자·오브젝트 상호작용</li>
          <li>M 키로 미니맵 확장</li>
          <li>마우스 휠로 화면 확대/축소</li>
          <li>다른 공간에 있는 아바타는 보이지 않음(사용자 목록에서 위치 확인 가능)</li>
        </ul>
      </section>

      <section>
        <div className={STYLES.title}>
          <CircleDashed size={TITLE_ICON_SIZE} />
          바운더리 시스템
        </div>
        <ul className={STYLES.list}>
          <li>바운더리는 다른 사용자에 가까이 다가가면 형성</li>
          <li>바운더리 안에 있는 사용자와만 음성·채팅 연결</li>
          <li>멀어지면 대화가 자동으로 종료</li>
          <li>로비에서만 바운더리 적용</li>
        </ul>
      </section>
    </div>
  );
};

export default Controls;
