import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useSavedAnswers = create(
  persist(
    (set, get) => ({
      savedAnswers: [],
      setSavedAnswers: (savedAnswers) =>
        set((state) => ({ ...state, savedAnswers })),
      setChosenAnswer: (chosenAnswer) => {
        set((state) => {
          const savedAnswers = [...state.savedAnswers];
          const index = savedAnswers.findIndex(
            (savedAnswer) => savedAnswer.id === chosenAnswer.id
          );

          savedAnswers[index] = chosenAnswer;
          return { savedAnswers };
        });
      },
      reset: () => set((state) => ({ ...state, savedAnswers: [] })),
    }),
    {
      name: "zustand-exam-saved-answers",
    }
  )
);
