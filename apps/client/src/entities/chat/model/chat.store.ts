import { create } from "zustand";

import type { ReceivedChatMessage } from "@livekit/components-react";

type ChatStore = {
  roomName: string | null;
  chatMessages: ReceivedChatMessage[];
  systemMessages: ReceivedChatMessage[];
  unreadCount: number;

  reset: (roomName: string) => void;
  addSystemMessage: (msg: ReceivedChatMessage) => void;
  setChatMessages: (msgs: ReceivedChatMessage[]) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  roomName: null,
  chatMessages: [],
  systemMessages: [],
  unreadCount: 0,

  reset: (roomName: string) => set({ roomName, chatMessages: [], systemMessages: [], unreadCount: 0 }),
  addSystemMessage: (msg) => {
    const { systemMessages } = get();
    const next = [...systemMessages, msg];
    set({ systemMessages: next });
  },
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnreadCount: () => set({ unreadCount: 0 }),
}));
