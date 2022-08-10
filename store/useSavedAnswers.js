import create from "zustand";
import { persist } from "zustand/middleware";

export const useSavedAnswers = create(
  persist(
    (set, get) => ({
      savedAnswers: [],
      setSavedAnswers: (savedAnswers) => set(() => ({ savedAnswers })),
      updateChosenAnswer: (qid, value) => {
        const newSavedAnswers = get().savedAnswers.find(
          (item) => item.exam_soal_id === qid
        );

        newSavedAnswers.answer_chosen_id = value;

        console.log(newSavedAnswers, get().savedAnswers);

        set(() => [...get().savedAnswers, newSavedAnswers]);
      },
    }),
    {
      name: "zustand-exam-saved-answers",
    }
  )
);
