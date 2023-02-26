import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useExamInfo = create(
  persist(
    (set, get) => ({
      examInfo: {
        start_time: null,
        end_time: null,
        mapel: null,
        tingkat: null,
        sheet_id: null,
        warn: null,
        warnEnabled: false,
      },

      setExamInfo: ({
        start_time,
        end_time,
        mapel,
        tingkat,
        sheet_id,
        warn,
        warnEnabled,
      }) =>
        set((state) => ({
          examInfo: {
            ...state.examInfo,
            start_time,
            end_time,
            mapel,
            tingkat,
            sheet_id,
            warn,
            warnEnabled,
          },
        })),

      setWarn: ({ warn }) => {
        // update warm
        set((state) => ({
          examInfo: {
            ...state.examInfo,
            warn,
          },
        }));
      },
      reset: () =>
        set(() => ({
          examInfo: {
            start_time: null,
            end_time: null,
            mapel: null,
            tingkat: null,
            sheet_id: null,
            warn: null,
            warnEnabled: false,
          },
        })),
    }),

    {
      name: "zustand-exam-info",
    }
  )
);
