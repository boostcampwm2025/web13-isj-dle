import { Check, X } from "lucide-react";

import type { Knock } from "@shared/types";

interface KnockRequestCardProps {
  knock: Knock;
  onAccept: (fromUserId: string) => void;
  onReject: (fromUserId: string) => void;
}

export const KnockRequestCard = ({ knock, onAccept, onReject }: KnockRequestCardProps) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm">
      <p className="mb-3 text-sm text-gray-700">
        <span className="font-semibold text-gray-900">{knock.fromUserNickname}</span>
        <span>님께서 노크를 요청했습니다.</span>
        <br />
        <span className="text-gray-500">수락하시겠습니까?</span>
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(knock.fromUserId)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
        >
          <Check size={16} />
          수락
        </button>
        <button
          onClick={() => onReject(knock.fromUserId)}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-rose-500 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600"
        >
          <X size={16} />
          거절
        </button>
      </div>
    </div>
  );
};
