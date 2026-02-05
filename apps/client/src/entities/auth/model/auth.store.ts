import type { AuthUser } from "@shared/types";

import { create } from "zustand";

interface AuthState {
  authUser: AuthUser | null;
  isLoading: boolean;

  setAuthUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authUser: null,
  isLoading: true,

  setAuthUser: (user) =>
    set({
      authUser: user,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
