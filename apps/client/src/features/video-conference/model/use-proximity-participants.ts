import type { Participant } from "livekit-client";

import { useMemo } from "react";

import { useUser } from "@entities/user";
import { useParticipants } from "@livekit/components-react";

export function useProximityParticipants(): Participant[] {
  const { user, users } = useUser();
  const participants = useParticipants();

  const proximityParticipants = useMemo(() => {
    const currentUserFromList = users.find((u) => u.id === user?.id);
    const contactId = currentUserFromList?.contactId ?? user?.contactId;

    if (!contactId) return [];

    // contactId가 같은 사용자들의 userId 목록
    const proximityUserIds = users.filter((u) => u.contactId === contactId).map((u) => u.id);

    // participant.identity가 proximityUserIds에 포함된 참가자만 필터링
    const filtered = participants.filter((participant) => {
      return proximityUserIds.includes(participant.identity);
    });

    return filtered;
  }, [user, users, participants]);

  return proximityParticipants;
}
