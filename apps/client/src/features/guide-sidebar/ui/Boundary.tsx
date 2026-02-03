import { STYLES, TITLE_ICON_SIZE } from "../model/space.constants";
import { CircleDashed } from "lucide-react";

const Boundary = () => {
  return (
    <div>
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
    </div>
  );
};

export default Boundary;
