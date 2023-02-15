import create from "zustand";
import { persist } from "zustand/middleware";

export const useExamTime = create(
  persist(
    (set, get) => ({
      submitable: false,
      setSubmitable: (submitable) => set({ submitable }),
    }),

    {
      name: "examTime",
    }
  )
);
