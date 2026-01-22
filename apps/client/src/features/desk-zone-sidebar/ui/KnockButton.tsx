import { KNOCK_BUTTON_MESSAGE } from "../model/desk-status.constants";

import type { DeskStatus } from "@shared/types";

interface KnockButtonProps {
  targetNickname: string;
  targetDeskStatus: DeskStatus | null;
  myDeskStatus: DeskStatus | null;
  canKnock: boolean;
  onClick: () => void;
}

const getButtonMessage = (
  targetDeskStatus: DeskStatus | null,
  myDeskStatus: DeskStatus | null,
  targetNickname: string,
): string => {
  if (targetDeskStatus === "focusing") return KNOCK_BUTTON_MESSAGE.FOCUSING;
  if (targetDeskStatus === "talking") return KNOCK_BUTTON_MESSAGE.TALKING;
  if (myDeskStatus !== "available") return KNOCK_BUTTON_MESSAGE.NOT_AVAILABLE;
  return KNOCK_BUTTON_MESSAGE.KNOCK_TO(targetNickname);
};

export const KnockButton = ({
  targetNickname,
  targetDeskStatus,
  myDeskStatus,
  canKnock,
  onClick,
}: KnockButtonProps) => {
  const message = getButtonMessage(targetDeskStatus, myDeskStatus, targetNickname);

  return (
    <button
      onClick={onClick}
      disabled={!canKnock}
      className={`w-full rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
        canKnock ? "bg-indigo-500 text-white hover:bg-indigo-600" : "cursor-not-allowed bg-gray-100 text-gray-400"
      }`}
    >
      {message}
    </button>
  );
};
