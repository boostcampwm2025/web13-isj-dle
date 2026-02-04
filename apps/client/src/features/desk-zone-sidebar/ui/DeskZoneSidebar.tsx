import { ICON_SIZE } from "../model/desk-status.constants";
import { EndTalkConfirmModal } from "./EndTalkConfirmModal";
import { KnockButton } from "./KnockButton";
import { KnockFailedModal } from "./KnockFailedModal";
import { KnockRequestCard } from "./KnockRequestCard";
import { MyStatusSelector } from "./MyStatusSelector";
import { UserListItem } from "./UserListItem";
import { Bell, PhoneOff, Users } from "lucide-react";

import { useState } from "react";

import { useKnockStore } from "@entities/knock";
import { useUserStore } from "@entities/user";
import { useKnock } from "@features/knock";

const DeskZoneSidebar = () => {
  const socketId = useUserStore((s) => s.user?.socketId);
  const deskStatus = useUserStore((s) => s.user?.deskStatus);
  const users = useUserStore((s) => s.users);
  const receivedKnocks = useKnockStore((s) => s.receivedKnocks);
  const knockFailedMessage = useKnockStore((s) => s.knockFailedMessage);
  const setKnockFailedMessage = useKnockStore((s) => s.setKnockFailedMessage);

  const { sendKnock, acceptKnock, rejectKnock, updateDeskStatus, canKnockTo, endTalk, isTalking } = useKnock();

  const [showEndTalkConfirm, setShowEndTalkConfirm] = useState(false);
  const [pendingAcceptSocketId, setPendingAcceptSocketId] = useState<string | null>(null);
  const [selectedSocketId, setSelectedSocketId] = useState<string | null>(null);

  const deskZoneUsers = users.filter((u) => u.avatar.currentRoomId === "desk zone");

  const sortedUsers = [...deskZoneUsers].sort((a, b) => {
    if (a.socketId === socketId) return -1;
    if (b.socketId === socketId) return 1;
    return a.nickname.localeCompare(b.nickname);
  });

  const handleUserClick = (socketId: string) => {
    setSelectedSocketId(selectedSocketId === socketId ? null : socketId);
  };

  const handleKnockClick = () => {
    if (selectedSocketId && canKnockTo(selectedSocketId)) {
      sendKnock(selectedSocketId);
      setSelectedSocketId(null);
    }
  };

  const handleAcceptKnock = (fromSocketId: string) => {
    if (isTalking) {
      setPendingAcceptSocketId(fromSocketId);
      setShowEndTalkConfirm(true);
    } else {
      acceptKnock(fromSocketId);
    }
  };

  const handleConfirmEndAndAccept = () => {
    endTalk();
    if (pendingAcceptSocketId) {
      setTimeout(() => {
        acceptKnock(pendingAcceptSocketId);
        setPendingAcceptSocketId(null);
      }, 100);
    }
    setShowEndTalkConfirm(false);
  };

  const handleCancelEndTalk = () => {
    setShowEndTalkConfirm(false);
    setPendingAcceptSocketId(null);
  };

  return (
    <div className="flex h-full w-full flex-col gap-4">
      <section className="flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="mb-2 flex items-center gap-2 py-2 text-sm font-semibold text-gray-600">
          <Users size={ICON_SIZE} />
          <span>데스크존 사용자</span>
          <span className="text-gray-400">({deskZoneUsers.length})</span>
        </div>

        <div className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {sortedUsers.map((u) => {
            const isMe = u.socketId === socketId;
            const isSelected = selectedSocketId === u.socketId;

            return (
              <div key={u.socketId}>
                <UserListItem
                  user={u}
                  isMe={isMe}
                  isSelected={isSelected}
                  onClick={() => handleUserClick(u.socketId)}
                />

                {isSelected && (
                  <div className="mt-1 mb-2 ml-2 rounded-lg bg-gray-50 p-2">
                    {isMe ? (
                      <div>
                        <p className="mb-1 text-xs font-medium text-gray-500">내 상태 변경</p>
                        <MyStatusSelector
                          currentStatus={deskStatus ?? null}
                          onStatusChange={updateDeskStatus}
                          isTalking={isTalking}
                        />
                      </div>
                    ) : (
                      <KnockButton
                        targetNickname={u.nickname}
                        targetDeskStatus={u.deskStatus}
                        myDeskStatus={deskStatus ?? null}
                        canKnock={canKnockTo(u.socketId)}
                        onClick={handleKnockClick}
                      />
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
          </div>

          <div className="flex max-h-48 flex-col gap-2 overflow-y-auto">
            {receivedKnocks.map((knock) => (
              <KnockRequestCard
                key={knock.fromSocketId}
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
            onClick={endTalk}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-rose-600"
          >
            <PhoneOff size={ICON_SIZE} />
            대화 종료하기
          </button>
        </section>
      )}

      <EndTalkConfirmModal
        isOpen={showEndTalkConfirm}
        onConfirm={handleConfirmEndAndAccept}
        onCancel={handleCancelEndTalk}
      />

      <KnockFailedModal
        isOpen={knockFailedMessage !== null}
        message={knockFailedMessage ?? ""}
        onClose={() => setKnockFailedMessage(null)}
      />
    </div>
  );
};

export default DeskZoneSidebar;
