import type { Space, SpaceContent } from "./space.types";
import { Briefcase, Code, Home, Presentation, Utensils } from "lucide-react";

export const SPACES: Record<Space, SpaceContent> = {
  lobby: {
    url: "/assets/maps/lobby.webp",
    Icon: Home,
    title: "로비",
    description: "공간 이동과 서비스 시작 지점",
    items: [
      "다른 공간으로 이동하는 메인 허브",
      "웹·안드로이드·iOS 회의실과 모여방이 배치",
      <>
        왼쪽 상단부터 오른쪽으로 <b>web 1-10 회의실, web 11-20 회의실, web 21-30 회의실</b>이 배치되어있음
      </>,
      <>
        왼쪽 하단부터 오른쪽으로 <b>android 1-3 회의실, ios 1-5 회의실, 모여방</b>이 배치되어있음
      </>,
      "회의실 입장 시 상세 회의실을 고르는 모달이 표시됨",
      "모여방은 자유 출입 가능하며 휴식과 가벼운 대화에 적합",
      "회의실에서는 공동 협업 툴 제공(화이트보드, 코드에디터)",
      "회의실: 데일리 스크럼, 기획, 논의",
      "모여방: 자유로운 대화, 휴식",
    ],
  },
  desk_zone: {
    url: "/assets/maps/desk_zone.webp",
    Icon: Briefcase,
    title: "데스크존",
    description: "집중 작업 + 필요할 때만 대화",
    items: ["기본적으로 화상회의 비활성화", "상대가 ‘노크 가능’ 상태일 때 노크로 대화 요청"],
  },
  mogakco: {
    url: "/assets/maps/mogakco.webp",
    Icon: Code,
    title: "모각코방",
    description: "모여서 각자 집중 코딩",
    items: ["조용한 개인 작업 공간", "필요 시 다른 사용자와 대화 및 채팅 가능", "사용자별 타이머, 스톱워치 기능 제공"],
  },
  restaurant: {
    url: "/assets/maps/restaurant.webp",
    Icon: Utensils,
    title: "식당",
    description: "점심, 저녁 식사 및 자유로운 대화",
    items: ["자유로운 대화 가능", "음식 사진을 공유하며 소통 가능"],
  },
  seminar_lounge: {
    url: "/assets/maps/seminar_lounge.webp",
    Icon: Presentation,
    title: "세미나실 (라운지)",
    description: "오픈 스테이지, 타운홀",
    items: [
      "발표자 중심 세미나 진행",
      "단상 위에 올라간 사용자가 호스트 권한을 가짐",
      "소회의실 기능 제공",
      "공동 협업 툴 제공(화이트보드, 코드에디터)",
    ],
  },
  seminar_web: {
    url: "/assets/maps/seminar_web.webp",
    Icon: Presentation,
    title: "세미나실 (웹)",
    description: "마스터 클래스",
    items: [
      "발표자 중심 세미나 진행",
      "단상 위에 올라간 사용자가 호스트 권한을 가짐",
      "소회의실 기능 제공",
      "공동 협업 툴 제공(화이트보드, 코드에디터)",
    ],
  },
  seminar_ios: {
    url: "/assets/maps/seminar_ios.webp",
    Icon: Presentation,
    title: "세미나실 (iOS)",
    description: "마스터 클래스",
    items: [
      "발표자 중심 세미나 진행",
      "단상 위에 올라간 사용자가 호스트 권한을 가짐",
      "소회의실 기능 제공",
      "공동 협업 툴 제공(화이트보드, 코드에디터)",
    ],
  },
  seminar_android: {
    url: "/assets/maps/seminar_android.webp",
    Icon: Presentation,
    title: "세미나실 (Android)",
    description: "마스터 클래스",
    items: [
      "발표자 중심 세미나 진행",
      "단상 위에 올라간 사용자가 호스트 권한을 가짐",
      "소회의실 기능 제공",
      "공동 협업 툴 제공(화이트보드, 코드에디터)",
    ],
  },
};

export const STYLES = {
  title: "mb-2 flex items-center gap-2 font-medium text-blue-800",
  list: "list-disc space-y-1 pl-5 text-sm text-gray-600",
};

export const REPORT_LINK =
  "https://docs.google.com/spreadsheets/d/1naWb9lDCvzN-5A-RFKcjnrbFSvCc0cz-PNG0Sj4ddxg/edit?gid=69997345#gid=69997345";

export const TITLE_ICON_SIZE = 18;
export const SUB_ICON_SIZE = 16;
