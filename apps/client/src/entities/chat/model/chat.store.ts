import { create } from "zustand";

import type { ReceivedChatMessage } from "@livekit/components-react";

type ChatStore = {
  roomName: string | null;
  chatMessages: ReceivedChatMessage[];
  systemMessages: ReceivedChatMessage[];

  reset: (roomName: string) => void;
  addSystemMessage: (msg: ReceivedChatMessage) => void;
  setChatMessages: (msgs: ReceivedChatMessage[]) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  roomName: null,
  chatMessages: [],
  systemMessages: [],

  reset: (roomName: string) => set({ roomName, chatMessages: [], systemMessages: [] }),
  addSystemMessage: (msg) => {
    const { systemMessages } = get();
    const next = [...systemMessages, msg];
    set({ systemMessages: next });
  },
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
}));
