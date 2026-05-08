import { create } from 'zustand';

export const useGroupStore = create((set) => ({
  createGroupOpen: false,
  joinGroupOpen: false,
  setCreateGroupOpen: (createGroupOpen) => set({ createGroupOpen }),
  setJoinGroupOpen: (joinGroupOpen) => set({ joinGroupOpen }),
}));
