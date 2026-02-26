import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useExamInfo = create(
  persist(
    (set, get) => ({
      examInfo: {
        start_time: null,
        end_time: null,
        server_now_ms: null,
        sync_perf_now: null,
        mapel: null,
        tingkat: null,
        sheet_id: null,
        warn: null,
        warnEnabled: false,
      },

      setExamInfo: ({
        start_time,
        end_time,
        server_now_ms,
        sync_perf_now,
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
            server_now_ms,
            sync_perf_now,
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

      setServerClock: ({ server_now_ms, sync_perf_now }) => {
        set((state) => ({
          examInfo: {
            ...state.examInfo,
            server_now_ms,
            sync_perf_now,
          },
        }));
      },

      reset: () =>
        set(() => ({
          examInfo: {
            start_time: null,
            end_time: null,
            server_now_ms: null,
            sync_perf_now: null,
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
