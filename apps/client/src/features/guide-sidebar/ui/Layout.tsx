import { STYLES, TITLE_ICON_SIZE } from "../model/space.constants";
import { MapPinned, PanelBottom, PanelLeft, PanelRight } from "lucide-react";

const Layout = () => {
  return (
    <div className="flex flex-col gap-8">
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
          <PanelRight size={TITLE_ICON_SIZE} />
          사이드바 조작
        </div>
        <ul className={STYLES.list}>
          <li>우측 사이드바 아이콘으로 도구 열기/닫기</li>
          <li>필요한 기능만 선택적으로 표시 가능</li>
        </ul>
      </section>

      <section>
        <div className={STYLES.title}>
          <PanelLeft size={TITLE_ICON_SIZE} />
          배율 조정
        </div>
        <ul className={STYLES.list}>
          <li>화면 좌측 상단의 배율 조정 바를 이용해 공간의 확대/축소 가능</li>
        </ul>
      </section>

      <section>
        <div className={STYLES.title}>
          <MapPinned size={TITLE_ICON_SIZE} />
          미니맵 조작
        </div>
        <ul className={STYLES.list}>
          <li>미니맵 아이콘 클릭 또는 M 키로 미니맵 확장/축소 가능</li>
          <li>미니맵 내에서 현위치 확인 가능</li>
        </ul>
      </section>
    </div>
  );
};

export default Layout;
