import { ICON_SIZE } from "../model/desk-status.constants";
import { KnockRequestCard } from "./KnockRequestCard";
import { MyStatusSelector } from "./MyStatusSelector";
import { UserListItem } from "./UserListItem";
import { Bell, PhoneOff, Users } from "lucide-react";

import { useState } from "react";

import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useKnock } from "@features/knock";

const DeskzoneSidebar = () => {
  const user = useUserStore((s) => s.user);
  const users = useUserStore((s) => s.users);
  const receivedKnocks = useKnockStore((s) => s.receivedKnocks);

  const { sendKnock, acceptKnock, rejectKnock, updateDeskStatus, canKnockTo, endTalk, isTalking } = useKnock();

  const [showEndTalkConfirm, setShowEndTalkConfirm] = useState(false);
  const [pendingAcceptUserId, setPendingAcceptUserId] = useState<string | null>(null);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const deskzoneUsers = users.filter((u) => u.avatar.currentRoomId === "desk zone");

  const sortedUsers = [...deskzoneUsers].sort((a, b) => {
    if (a.id === user?.id) return -1;
    if (b.id === user?.id) return 1;
    return a.nickname.localeCompare(b.nickname);
  });

  const handleUserClick = (userId: string) => {
    setSelectedUserId(selectedUserId === userId ? null : userId);
  };

  const handleKnockClick = () => {
    if (selectedUserId && canKnockTo(selectedUserId)) {
      sendKnock(selectedUserId);
      setSelectedUserId(null);
    }
  };

  const handleAcceptKnock = (fromUserId: string) => {
    if (isTalking) {
      setPendingAcceptUserId(fromUserId);
      setShowEndTalkConfirm(true);
    } else {
      acceptKnock(fromUserId);
    }
  };

  const handleConfirmEndAndAccept = () => {
    endTalk();
    if (pendingAcceptUserId) {
      setTimeout(() => {
        acceptKnock(pendingAcceptUserId);
        setPendingAcceptUserId(null);
      }, 100);
    }
    setShowEndTalkConfirm(false);
  };

  const handleCancelEndTalk = () => {
    setShowEndTalkConfirm(false);
    setPendingAcceptUserId(null);
  };

  const handleEndTalk = () => {
    endTalk();
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <section className="flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="mb-2 flex items-center gap-2 py-2 text-sm font-semibold text-gray-600">
          <Users size={ICON_SIZE} />
          <span>데스크존 사용자</span>
          <span className="text-gray-400">({deskzoneUsers.length})</span>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {sortedUsers.map((u) => {
            const isMe = u.id === user?.id;
            const isSelected = selectedUserId === u.id;
            const targetUser = u;

            return (
              <div key={u.id}>
                <UserListItem user={u} isMe={isMe} isSelected={isSelected} onClick={() => handleUserClick(u.id)} />

                {isSelected && (
                  <div className="mt-1 mb-2 ml-2 rounded-lg bg-gray-50 p-2">
                    {isMe ? (
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-500">내 상태 변경</p>
                        <MyStatusSelector currentStatus={user?.deskStatus ?? null} onStatusChange={updateDeskStatus} />
                      </div>
                    ) : (
                      <button
                        onClick={handleKnockClick}
                        disabled={!canKnockTo(u.id)}
                        className={`w-full rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                          canKnockTo(u.id)
                            ? "bg-indigo-500 text-white hover:bg-indigo-600"
                            : "cursor-not-allowed bg-gray-100 text-gray-400"
                        }`}
                      >
                        {targetUser.deskStatus === "focusing"
                          ? "집중 중이라 노크할 수 없습니다"
                          : targetUser.deskStatus === "talking"
                            ? "대화 중이라 노크할 수 없습니다"
                            : user?.deskStatus !== "available"
                              ? "노크 가능 상태로 변경해주세요"
                              : `${targetUser.nickname}님께 노크하기`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {receivedKnocks.length > 0 && (
        <section className="flex flex-col border-t border-gray-200 pt-4">
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-gray-600">
            <Bell size={ICON_SIZE} />
            <span>노크 요청</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
              {receivedKnocks.length}
            </span>
          </div>

          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {receivedKnocks.map((knock) => (
              <KnockRequestCard
                key={knock.fromUserId}
                knock={knock}
                onAccept={handleAcceptKnock}
                onReject={rejectKnock}
              />
            ))}
          </div>
        </section>
      )}

      {isTalking && (
        <section className="border-t border-gray-200 pt-4">
          <button
            onClick={handleEndTalk}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-600"
          >
            <PhoneOff size={ICON_SIZE} />
            대화 종료하기
          </button>
        </section>
      )}

      {showEndTalkConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="mb-2 text-lg font-semibold text-gray-900">현재 대화를 종료하시겠습니까?</h3>
            <p className="mb-6 text-sm text-gray-500">새로운 노크를 수락하려면 현재 대화를 먼저 종료해야 합니다.</p>
            <div className="flex gap-3">
              <button
                onClick={handleCancelEndTalk}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                취소
              </button>
              <button
                onClick={handleConfirmEndAndAccept}
                className="flex-1 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600"
              >
                종료 후 수락
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeskzoneSidebar;
