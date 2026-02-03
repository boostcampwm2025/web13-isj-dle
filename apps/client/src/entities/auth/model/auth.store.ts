import { create } from "zustand";

import type { AuthUser } from "@shared/types";

interface AuthState {
  authUser: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  setAuthUser: (user: AuthUser | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authUser: null,
  isLoading: true,
  isAuthenticated: false,

  setAuthUser: (user) =>
    set({
      authUser: user,
      isAuthenticated: user !== null,
      isLoading: false,
    }),

  setLoading: (loading) => set({ isLoading: loading }),
}));
