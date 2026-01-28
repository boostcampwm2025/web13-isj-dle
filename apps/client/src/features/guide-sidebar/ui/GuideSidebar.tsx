import { REPORT_LINK, STYLES, SUB_ICON_SIZE, TITLE_ICON_SIZE } from "../model/space.constants";
import SpaceLayout from "./SpaceLayout";
import { Bug, CircleDashed, ExternalLink, Gamepad2, Map, PanelBottom, PanelLeft } from "lucide-react";

const GuideSidebar = () => {
  const handleReport = () => {
    window.open(REPORT_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="scrollbar-hide h-full space-y-10 overflow-y-auto">
      <section>
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
      </section>

      <section>
        <div className={STYLES.title}>
          <PanelBottom size={TITLE_ICON_SIZE} />
          네비게이션 바 조작
        </div>
        <ul className={STYLES.list}>
          <li>화면 하단 네비게이션 바 아이콘 클릭으로 기능 실행</li>
          <li>아이콘에 마우스를 올리면 툴팁 표시</li>
        </ul>
      </section>

      <section>
        <div className={STYLES.title}>
          <PanelLeft size={TITLE_ICON_SIZE} />
          사이드바 조작
        </div>
        <ul className={STYLES.list}>
          <li>우측 사이드바 아이콘으로 도구 열기/닫기</li>
          <li>필요한 기능만 선택적으로 표시 가능</li>
        </ul>
      </section>

      <section>
        <div className={STYLES.title}>
          <CircleDashed size={TITLE_ICON_SIZE} />
          바운더리 시스템
        </div>
        <ul className={STYLES.list}>
          <li>비운더리는 다른 사용자에 가까이 다가가면 형성</li>
          <li>바운더리 안에 있는 사용자와만 음성·채팅 연결</li>
          <li>멀어지면 대화가 자동으로 종료</li>
          <li>로비에서만 바운더리 적용</li>
        </ul>
      </section>

      <section>
        <div className={STYLES.title}>
          <Map size={TITLE_ICON_SIZE} />
          공간별 기능
        </div>
        <img src="/assets/maps/world.png" alt="공간 배치도" className="w-full rounded-lg border" />

        <SpaceLayout />
      </section>

      <section>
        <div className={`${STYLES.title} text-red-600`}>
          <Bug size={TITLE_ICON_SIZE} />
          오류 신고 및 개선 요청
        </div>
        <ul className={STYLES.list}>
          <li>문제가 발생하면 아래 버튼으로 제보해주세요</li>
          <li>가능하면 “무슨 행동을 했는지”를 함께 적어주세요</li>
        </ul>

        <button
          type="button"
          onClick={handleReport}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <ExternalLink size={SUB_ICON_SIZE} />
          오류 신고 및 개선 요청하기
        </button>
      </section>
    </div>
  );
};

export default GuideSidebar;
