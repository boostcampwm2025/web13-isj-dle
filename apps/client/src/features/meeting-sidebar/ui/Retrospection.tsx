import { useRetrospectiveTemplate } from "../model/use_retrospective_template";
import { Copy } from "lucide-react";

const Retrospection = () => {
  const { handleTemplate, template, error, resetTemplate, handleCopy } = useRetrospectiveTemplate();

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex flex-col items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gray-800">회고 템플릿</div>
            <div className="text-xs text-gray-500">랜덤으로 회고 양식을 받아보세요.</div>
          </div>

          <button
            onClick={handleTemplate}
            className="rounded-xl bg-amber-300 px-3 py-1 text-sm font-semibold text-amber-950 hover:bg-amber-400 active:scale-[0.95]"
          >
            랜덤 템플릿 받기
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-3">
        {!template ? (
          <div className="text-sm text-gray-500">버튼을 눌러 템플릿을 받아보세요.</div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex w-full flex-row items-center justify-between">
                <div className="text-sm font-semibold text-gray-800">선택된 템플릿</div>
                <button
                  onClick={resetTemplate}
                  className="rounded-xl bg-amber-100 px-3 py-1 text-xs text-amber-800 hover:bg-amber-200"
                >
                  템플릿 초기화
                </button>
              </div>
              {template.theme && (
                <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  {template.theme}
                </span>
              )}
            </div>

            <div className="mt-3 rounded-xl bg-gray-100 p-4">
              <div className="mb-2 flex w-full flex-row items-center justify-between">
                <div className="text-sm font-medium text-gray-700">템플릿 내용</div>
                <button
                  onClick={handleCopy}
                  className="rounded-md bg-gray-200 p-2 text-gray-700 hover:bg-gray-300"
                  title="복사하기"
                >
                  <Copy size={14} />
                </button>
              </div>
              <pre className="text-sm leading-6 wrap-break-word whitespace-pre-wrap text-gray-700">
                {template.content.trim()}
              </pre>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Retrospection;
