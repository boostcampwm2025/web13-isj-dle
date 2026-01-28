import { MAX_QUESTIONS, MIN_QUESTIONS } from "../model/meeting.constants";
import { useDailyScrum } from "../model/use_daily_scrum";

const DailyScrum = () => {
  const { handleQuestions, num, setNum, questions, error, resetQuestions } = useDailyScrum();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-gray-200 bg-white p-4">
        <div className="flex w-full items-center gap-2">
          <label className="shrink-0 text-sm font-medium whitespace-nowrap text-gray-600">질문 개수:</label>
          <input
            type="number"
            value={num}
            min={MIN_QUESTIONS}
            max={MAX_QUESTIONS}
            onChange={(e) =>
              setNum(Math.min(MAX_QUESTIONS, Math.max(MIN_QUESTIONS, Number(e.target.value) || MIN_QUESTIONS)))
            }
            className="flex-1 rounded-xl border-2 border-gray-300 bg-gray-50 px-3 py-1 text-sm outline-none focus:border-amber-400"
          />
        </div>
        <div className="flex flex-1 items-center justify-between">
          <div className="text-xs text-gray-500">{questions.length > 0 ? `${questions.length}개 표시 중` : ""}</div>
          <button
            onClick={handleQuestions}
            className="rounded-xl bg-amber-300 px-3 py-1 text-sm font-semibold text-amber-950 hover:bg-amber-400 active:scale-[0.95]"
          >
            랜덤 질문 받기
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="rounded-2xl border border-gray-200 bg-white p-4">
        <div className="mb-2 text-sm font-semibold text-gray-800">오늘의 질문</div>

        {questions.length === 0 ? (
          <div className="text-sm text-gray-500">버튼을 눌러 질문을 받아보세요.</div>
        ) : (
          <div>
            <button
              onClick={resetQuestions}
              className="mb-2 rounded-xl bg-amber-100 px-3 py-1 text-xs text-amber-800 hover:bg-amber-200"
            >
              질문 초기화
            </button>
            <ul className="space-y-2">
              {questions.map((q, index) => (
                <li key={index} className="flex gap-3 rounded-xl bg-gray-50 px-3 py-2 text-sm text-gray-700">
                  <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                    {index + 1}
                  </span>
                  <span className="wrap-break-word">{q.question}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyScrum;
