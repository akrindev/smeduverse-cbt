import create from "zustand";
import { persist } from "zustand/middleware";

export const useSavedAnswers = create(
  persist(
    (set, get) => ({
      savedAnswers: [],
      setSavedAnswers: (savedAnswers) => set(() => ({ savedAnswers })),
    }),
    {
      name: "zustand-exam-saved-answers",
    }
  )
);
