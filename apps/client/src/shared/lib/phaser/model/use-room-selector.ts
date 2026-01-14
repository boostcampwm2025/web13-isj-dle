import { useCallback, useState } from "react";

import type { RoomType } from "@shared/types";

export const useRoomSelector = (joinRoom: ((roomId: string) => void) | null | undefined, currentRoomId?: string) => {
  const [roomSelectorOpen, setRoomSelectorOpen] = useState(false);
  const [selectedRoomRange, setSelectedRoomRange] = useState<string>("");
  const [prevRoomId, setPrevRoomId] = useState(currentRoomId);

  if (currentRoomId !== prevRoomId) {
    setPrevRoomId(currentRoomId);

    if (roomSelectorOpen && currentRoomId === "lobby") {
      setRoomSelectorOpen(false);
    }
  }

  const openRoomSelector = useCallback((roomRange: string) => {
    setSelectedRoomRange(roomRange);
    setRoomSelectorOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setRoomSelectorOpen(false);
  }, []);

  const handleRoomSelect = useCallback(
    (roomId: RoomType) => {
      if (joinRoom) {
        joinRoom(roomId);
      }
      setRoomSelectorOpen(false);
    },
    [joinRoom],
  );

  return {
    roomSelectorOpen,
    selectedRoomRange,
    openRoomSelector,
    handleCloseModal,
    handleRoomSelect,
  };
};
