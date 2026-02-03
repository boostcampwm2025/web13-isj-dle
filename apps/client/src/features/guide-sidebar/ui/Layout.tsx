import { STYLES, TITLE_ICON_SIZE } from "../model/space.constants";
import { PanelBottom, PanelLeft } from "lucide-react";

const Layout = () => {
  return (
    <div>
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

      <section className="mt-8">
        <div className={STYLES.title}>
          <PanelLeft size={TITLE_ICON_SIZE} />
          사이드바 조작
        </div>
        <ul className={STYLES.list}>
          <li>우측 사이드바 아이콘으로 도구 열기/닫기</li>
          <li>필요한 기능만 선택적으로 표시 가능</li>
        </ul>
      </section>
    </div>
  );
};

export default Layout;
