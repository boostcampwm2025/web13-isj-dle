export interface TutorialStep {
  id: string;
  title: string;
  text: string;
  attachTo?: {
    element: string;
    on: "top" | "bottom" | "left" | "right";
  };
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: "welcome",
    title: "환영합니다! 👋",
    text: "MOYO에 오신 것을 환영해요.\n간단한 튜토리얼로 주요 기능을 소개해드릴게요.",
  },
  {
    id: "minimap",
    title: "미니맵으로 한눈에 보기 🗺️",
    text: "현재 공간의 전체 구조와\n내 위치를 한눈에 확인할 수 있어요.\n\nM키나 미니맵을 클릭해 공간 이름을 확인해보세요.",
    attachTo: {
      element: "[data-tutorial='minimap']",
      on: "right",
    },
  },
  {
    id: "movement",
    title: "자유롭게 이동해보세요 🚶",
    text: "방향키(↑↓←→) 또는 WASD 키로\n공간을 이동할 수 있어요.\n\n다른 사용자와 가까워지면 화상 통화가 연결돼요.",
  },
  {
    id: "sidebar-users",
    title: "사용자 목록 👥",
    text: "현재 접속 중인 사용자들과 위치를 확인할 수 있어요.",
    attachTo: {
      element: "[data-tutorial='sidebar-users']",
      on: "left",
    },
  },
  {
    id: "sidebar-spaceMove",
    title: "공간 이동 🧭",
    text: "원하는 공간으로 빠르게 이동할 수 있어요.\n\n데스크존, 회의실, 세미나실 등 다양한 공간이 있어요.",
    attachTo: {
      element: "[data-tutorial='sidebar-spaceMove']",
      on: "left",
    },
  },
  {
    id: "sidebar-collaboration-tool",
    title: "협업 도구 🛠️",
    text: "회의실과 세미나실에서는\n화이트보드와 코드 에디터로\n실시간 협업을 할 수 있어요.",
    attachTo: {
      element: "[data-tutorial='sidebar-collaboration-tool']",
      on: "left",
    },
  },
  {
    id: "sidebar-timer-stopwatch",
    title: "타이머 / 스톱워치 ⏱️",
    text: "시간 관리에 유용한 타이머와 스톱워치예요.\n회의실에서는 팀 회의시간을 관리하고,\n\n모각코방에선 뽀모도로 기법으로 집중력을 높여보세요.",
    attachTo: {
      element: "[data-tutorial='sidebar-timer-stopwatch']",
      on: "left",
    },
  },
  {
    id: "sidebar-chat",
    title: "실시간으로 소통해요 💬",
    text: "화상회의가 연결되면\n채팅으로 자유롭게 대화할 수 있어요.",
    attachTo: {
      element: "[data-tutorial='sidebar-chat']",
      on: "left",
    },
  },
  {
    id: "sidebar-deskZone",
    title: "데스크존 노크 🚪",
    text: "다른 사용자에게 노크를 보내\n대화를 요청할 수 있어요.\n\n데스크존에서 사용 가능해요.\n집중중 상태로 변경하면 노크를 받을 수 없어요.",
    attachTo: {
      element: "[data-tutorial='sidebar-deskZone']",
      on: "left",
    },
  },
  {
    id: "sidebar-host",
    title: "호스트 관리 👑",
    text: "세미나실에서 호스트가 되면\n책상 나누기와 음소거 제어를 할 수 있어요.",
    attachTo: {
      element: "[data-tutorial='sidebar-host']",
      on: "left",
    },
  },
  {
    id: "sidebar-restaurant",
    title: "식당 이미지 🍽️",
    text: "식당에서 오늘의 메뉴를 공유할 수 있어요.",
    attachTo: {
      element: "[data-tutorial='sidebar-restaurant']",
      on: "left",
    },
  },
  {
    id: "sidebar-guide",
    title: "이용 가이드 📖",
    text: "더 자세한 사용법이 궁금하다면\n이곳에서 확인해보세요.",
    attachTo: {
      element: "[data-tutorial='sidebar-guide']",
      on: "left",
    },
  },
  {
    id: "complete",
    title: "준비 완료! 🎉",
    text: "이제 MOYO를 자유롭게 이용해보세요.",
  },
];

export const TUTORIAL_STORAGE_KEY = "moyo-tutorial-completed";
export const TUTORIAL_AUTO_START_DELAY = 1500;
