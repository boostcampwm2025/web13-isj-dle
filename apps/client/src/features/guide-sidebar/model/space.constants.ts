import type { Space, SpaceContent } from "./space.types";
import { Briefcase, Code, Home, Presentation, Utensils } from "lucide-react";

export const spaces: Record<Space, SpaceContent> = {
  lobby: {
    url: "/assets/maps/lobby.png",
    Icon: Home,
    title: "로비",
    description: "공간 이동과 서비스 시작 지점",
    items: ["다른 공간으로 이동 가능", "전체 서비스 안내 공간"],
  },
  desk_zone: {
    url: "/assets/maps/desk_zone.png",
    Icon: Briefcase,
    title: "데스크존",
    description: "집중 작업 + 필요할 때만 대화",
    items: ["기본적으로 카메라·마이크 비활성화", "상대가 ‘노크 가능’ 상태일 때 노크로 대화 요청"],
  },
  mogakco: {
    url: "/assets/maps/mogakco.png",
    Icon: Code,
    title: "모각코방",
    description: "모여서 각자 집중 코딩",
    items: ["조용한 개인 작업 공간", "필요 시 근처 사용자와 대화 가능"],
  },
  restaurant: {
    url: "/assets/maps/restaurant.png",
    Icon: Utensils,
    title: "식당",
    description: "가벼운 대화와 휴식 공간",
    items: ["자유로운 대화 가능", "휴식 및 소통 목적 공간"],
  },
  seminar_lounge: {
    url: "/assets/maps/seminar_lounge.png",
    Icon: Presentation,
    title: "세미나실 (라운지)",
    description: "대규모 발표 및 강연 공간",
    items: ["발표자 중심 세미나 진행", "질의응답 가능"],
  },
  seminar_web: {
    url: "/assets/maps/seminar_web.png",
    Icon: Presentation,
    title: "세미나실 (웹)",
    description: "대규모 발표 및 강연 공간",
    items: ["발표자 중심 세미나 진행", "질의응답 가능"],
  },
  seminar_ios: {
    url: "/assets/maps/seminar_ios.png",
    Icon: Presentation,
    title: "세미나실 (iOS)",
    description: "대규모 발표 및 강연 공간",
    items: ["발표자 중심 세미나 진행", "질의응답 가능"],
  },
  seminar_android: {
    url: "/assets/maps/seminar_android.png",
    Icon: Presentation,
    title: "세미나실 (Android)",
    description: "대규모 발표 및 강연 공간",
    items: ["발표자 중심 세미나 진행", "질의응답 가능"],
  },
};

export const styles = {
  title: "mb-2 flex items-center gap-2 font-medium text-blue-800",
  list: "list-disc space-y-1 pl-5 text-sm text-gray-600",
};
