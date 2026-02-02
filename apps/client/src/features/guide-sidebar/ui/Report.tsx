import { REPORT_LINK, STYLES, SUB_ICON_SIZE, TITLE_ICON_SIZE } from "../model/space.constants";
import { Bug, ExternalLink } from "lucide-react";

const Report = () => {
  const handleReport = () => {
    window.open(REPORT_LINK, "_blank", "noopener,noreferrer");
  };

  return (
    <div>
      <section>
        <div className={`${STYLES.title} text-red-600`}>
          <Bug size={TITLE_ICON_SIZE} />
          오류 신고 및 개선 요청
        </div>
        <ul className={STYLES.list}>
          <li>문제가 발생하면 아래 버튼으로 제보해주세요</li>
          <li>가능하면 "무슨 행동을 했는지"를 함께 적어주세요</li>
        </ul>

        <button
          type="button"
          onClick={handleReport}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <ExternalLink size={SUB_ICON_SIZE} />
          오류 신고 및 개선 요청하기
        </button>
      </section>
    </div>
  );
};

export default Report;
