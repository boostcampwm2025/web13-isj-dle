import type { User } from "@shared/types";

import { DeskStatusBadge } from "./DeskStatusBadge";

interface UserListItemProps {
  user: User;
  isMe: boolean;
  isSelected: boolean;
  onClick: () => void;
}

export const UserListItem = ({ user, isMe, isSelected, onClick }: UserListItemProps) => {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between border px-3 py-2.5 text-left transition-colors ${
        isSelected ? "border-indigo-300 bg-indigo-50 ring-1 ring-indigo-200" : "border-transparent hover:bg-gray-50"
      } ${isMe ? "bg-gray-50" : ""}`}
    >
      <div className="flex items-center gap-2">
        <span className={`text-sm ${isMe ? "font-semibold text-gray-900" : "text-gray-700"}`}>
          {user.nickname}
          {isMe && <span className="ml-1 text-xs text-gray-400">(나)</span>}
        </span>
      </div>
      <DeskStatusBadge status={user.deskStatus} />
    </button>
  );
};
