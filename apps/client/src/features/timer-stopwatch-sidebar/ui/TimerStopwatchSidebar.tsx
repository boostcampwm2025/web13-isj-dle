import { COLLABORATION_TOOL, CollaborationToolSidebar } from "@entities/collaboration-tool";

const TimerStopwatchSidebar = () => {
  return (
    <CollaborationToolSidebar
      toolType={COLLABORATION_TOOL.TIMER_STOPWATCH}
      title="타이머/스톱워치"
      description="회의나 협업 중 시간을 효율적으로 관리할 수 있도록 타이머와 스톱워치를 제공하는 협업 도구입니다. 재생·정지·초기화가 가능하며, 타이머 종료 시 알림을 통해 작업 흐름을 명확히 구분할 수 있습니다."
      features={[
        "타이머 / 스톱워치 모드 전환",
        "재생 · 정지 · 초기화 컨트롤 제공",
        "타이머 시간 직접 설정 가능",
        "종료 10초 전 시각적 변화로 종료 예고",
        "시간 종료 시 알림(사운드 / 토스트) 제공",
      ]}
      buttonColor="blue"
    />
  );
};

export default TimerStopwatchSidebar;
