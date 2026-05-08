import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  initialized: false,
  setAuth: ({ user, accessToken }) => set({ user, accessToken, initialized: true }),
  setAccessToken: (accessToken) => set((state) => ({ ...state, accessToken })),
  setUser: (user) => set((state) => ({ ...state, user })),
  markInitialized: () => set({ initialized: true }),
  clearAuth: () => set({ user: null, accessToken: null, initialized: true }),
}));
