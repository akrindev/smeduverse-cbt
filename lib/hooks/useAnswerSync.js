import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "./auth";
import { useExamInfo } from "../../store/useExamInfo";
import { createAnswerQueue } from "../exam/answerQueue";

const FLUSH_INTERVAL_MS = 10_000;
const RETRY_DELAYS_MS = [1_000, 2_000, 4_000];

const AnswerSyncContext = createContext(null);

function createSyncQueue() {
  let retryAttempt = 0;
  const retryTimers = new Set();

  const queue = createAnswerQueue({
    send: (payload) => api.patch("/api/exam/save-answer", payload),
    scheduleRetry: (task) => {
      const delay =
        RETRY_DELAYS_MS[
          Math.min(retryAttempt, RETRY_DELAYS_MS.length - 1)
        ] ?? 0;
      retryAttempt += 1;

      const timer = setTimeout(() => {
        retryTimers.delete(timer);
        void Promise.resolve(task()).catch((error) => {
          console.error("[useAnswerSync] Retry failed", error);
        });
      }, delay);
      retryTimers.add(timer);
      return timer;
    },
  });

  return {
    queue,
    resetRetrySchedule() {
      retryAttempt = 0;
    },
    dispose() {
      for (const timer of retryTimers) {
        clearTimeout(timer);
      }
      retryTimers.clear();
    },
  };
}

export function AnswerSyncProvider({ children }) {
  const sheetId = useExamInfo((state) => state.examInfo.sheet_id);
  const [syncQueue] = useState(createSyncQueue);
  const [queueState, setQueueState] = useState(() =>
    syncQueue.queue.getState()
  );

  const flushAnswers = useCallback(async () => {
    try {
      const nextState = await syncQueue.queue.flush();
      setQueueState(nextState);
      return nextState;
    } finally {
      syncQueue.resetRetrySchedule();
    }
  }, [syncQueue]);

  const retryAnswers = useCallback(async () => {
    try {
      const nextState = await syncQueue.queue.retry();
      setQueueState(nextState);
      return nextState;
    } finally {
      syncQueue.resetRetrySchedule();
    }
  }, [syncQueue]);

  const enqueueAnswer = useCallback(
    (payload) => {
      if (sheetId === null || sheetId === undefined) {
        return syncQueue.queue.getState();
      }

      const nextState = syncQueue.queue.enqueue({
        sheetId,
        payload,
      });
      setQueueState(nextState);
      void flushAnswers();
      return nextState;
    },
    [flushAnswers, sheetId, syncQueue]
  );

  useEffect(() => {
    const unsubscribe = syncQueue.queue.subscribe(setQueueState);
    return () => {
      unsubscribe();
      syncQueue.dispose();
    };
  }, [syncQueue]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    void flushAnswers();
    window.addEventListener("online", flushAnswers);
    const intervalId = window.setInterval(flushAnswers, FLUSH_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", flushAnswers);
      window.clearInterval(intervalId);
    };
  }, [flushAnswers]);

  const contextValue = useMemo(
    () => ({
      pendingCount: queueState.pendingCount,
      entries: queueState.entries,
      statusSummary: queueState.statusSummary,
      enqueueAnswer,
      flushAnswers,
      retryAnswers,
    }),
    [enqueueAnswer, flushAnswers, queueState, retryAnswers]
  );

  return createElement(
    AnswerSyncContext.Provider,
    { value: contextValue },
    children
  );
}

export function useAnswerSync() {
  const context = useContext(AnswerSyncContext);
  if (!context) {
    throw new Error("useAnswerSync must be used within AnswerSyncProvider");
  }

  return context;
}

export default useAnswerSync;
