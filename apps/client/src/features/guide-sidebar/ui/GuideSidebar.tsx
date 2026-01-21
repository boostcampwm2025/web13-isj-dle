import { styles } from "../model/space.constants";
import SpaceLayout from "./SpaceLayout";
import { Bug, CircleDashed, Gamepad2, Mail, Map, PanelBottom, PanelLeft } from "lucide-react";

const GuideSidebar = () => {
  const handleReport = () => {
    // TODO: 너희 신고 방식에 맞게 연결
    // 1) 모달 열기
    // 2) 디스코드/슬랙 링크 열기
    // 3) 내부 API로 제보 전송 등
    console.log("report");
  };

  return (
    <div className="scrollbar-hide h-full space-y-10 overflow-y-auto">
      <section>
        <div className={styles.title}>
          <Gamepad2 size={18} />
          기본 조작
        </div>
        <ul className={styles.list}>
          <li>WASD / 방향키로 이동</li>
          <li>E 키로 의자·오브젝트 상호작용</li>
        </ul>
      </section>

      <section>
        <div className={styles.title}>
          <PanelBottom size={18} />
          네비게이션 바 조작
        </div>
        <ul className={styles.list}>
          <li>화면 하단 네비게이션 바 아이콘 클릭으로 기능 실행</li>
          <li>아이콘에 마우스를 올리면 툴팁 표시</li>
        </ul>
      </section>

      <section>
        <div className={styles.title}>
          <PanelLeft size={18} />
          사이드바 조작
        </div>
        <ul className={styles.list}>
          <li>우측 사이드바 아이콘으로 도구 열기/닫기</li>
          <li>필요한 기능만 선택적으로 표시 가능</li>
        </ul>
      </section>

      <section>
        <div className={styles.title}>
          <CircleDashed size={18} />
          바운더리 시스템
        </div>
        <ul className={styles.list}>
          <li>비운더리는 다른 사용자에 가까이 다가가면 형성</li>
          <li>바운더리 안에 있는 사용자와만 음성·채팅 연결</li>
          <li>멀어지면 대화가 자동으로 종료</li>
        </ul>
      </section>

      <section>
        <div className={styles.title}>
          <Map size={18} />
          공간별 기능
        </div>
        <img src="/assets/maps/world.png" alt="공간 배치도" className="w-full rounded-lg border" />

        <SpaceLayout />
      </section>

      <section>
        <div className={`${styles.title} text-red-600`}>
          <Bug size={18} />
          오류 신고
        </div>
        <ul className={styles.list}>
          <li>문제가 발생하면 아래 버튼으로 제보해주세요</li>
          <li>가능하면 “무슨 행동을 했는지”를 함께 적어주세요</li>
        </ul>

        <button
          type="button"
          onClick={handleReport}
          className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Mail size={16} />
          오류 신고하기
        </button>
      </section>
    </div>
  );
};

export default GuideSidebar;
