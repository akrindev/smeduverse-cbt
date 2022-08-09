import create from "zustand";
import { persist } from "zustand/middleware";

export const useExamQuestions = create(
  persist(
    (set, get) => ({
      questions: [],
      setQuestions: (questions) => set(() => ({ questions })),
    }),
    {
      name: "zustand-exam-questions",
    }
  )
);
