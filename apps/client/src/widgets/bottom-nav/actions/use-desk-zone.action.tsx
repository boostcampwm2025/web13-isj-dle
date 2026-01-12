import { Briefcase } from "lucide-react";

export const useDeskZoneAction = () => {
  const handleClick = () => {
    console.log("Desk Zone action clicked");
  };

  return {
    title: "데스크 존으로 가기",
    icon: <Briefcase color="orange" />,
    handleClick,
  };
};
