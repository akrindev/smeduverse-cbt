import create from "zustand";
import { persist } from "zustand/middleware";

export const useExamQuestions = create(
  persist(
    (set, get) => ({
      questions: [],
      questionIndex: 0,
      setQuestions: (questions) => set(() => ({ questions })),
      setQuestionIndex: (questionIndex) => set(() => ({ questionIndex })),
    }),
    {
      name: "zustand-exam-questions",
    }
  )
);
