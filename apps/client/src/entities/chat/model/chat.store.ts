import { create } from "zustand";

import type { ReceivedChatMessage } from "@livekit/components-react";

type SendFunction = (message: string) => Promise<void>;

type ChatStore = {
  roomName: string | null;
  chatMessages: ReceivedChatMessage[];
  systemMessages: ReceivedChatMessage[];
  unreadCount: number;
  send: SendFunction | null;
  isSending: boolean;

  reset: (roomName: string) => void;
  addSystemMessage: (msg: ReceivedChatMessage) => void;
  setChatMessages: (msgs: ReceivedChatMessage[]) => void;
  incrementUnreadCount: () => void;
  resetUnreadCount: () => void;
  setSend: (send: SendFunction | null) => void;
  setIsSending: (isSending: boolean) => void;
};

export const useChatStore = create<ChatStore>((set, get) => ({
  roomName: null,
  chatMessages: [],
  systemMessages: [],
  unreadCount: 0,
  send: null,
  isSending: false,

  reset: (roomName: string) => set({ roomName, chatMessages: [], systemMessages: [], unreadCount: 0 }),
  addSystemMessage: (msg) => {
    const { systemMessages } = get();
    const next = [...systemMessages, msg];
    set({ systemMessages: next });
  },
  setChatMessages: (msgs) => set({ chatMessages: msgs }),
  incrementUnreadCount: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
  resetUnreadCount: () => set({ unreadCount: 0 }),
  setSend: (send) => set({ send }),
  setIsSending: (isSending) => set({ isSending }),
}));
