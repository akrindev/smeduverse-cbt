import create from "zustand";
import { persist } from "zustand/middleware";

export const useSavedAnswers = create(
  persist(
    (set, get) => ({
      savedAnswers: [],
      setSavedAnswers: (savedAnswers) =>
        set((state) => ({
          ...state.savedAnswers,
          savedAnswers,
        })),
      updateChosenAnswer: (qid, value) => {
        const newSavedAnswers = get().savedAnswers.find(
          (item) => item.exam_soal_id === qid
        );

        newSavedAnswers.answer_chosen_id = value;

        set(() => [...get().savedAnswers, newSavedAnswers]);
      },
    }),
    {
      name: "zustand-exam-saved-answers",
    }
  )
);
