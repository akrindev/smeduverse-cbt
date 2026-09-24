import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
    send: (payload, metadata = {}) => {
      const endpoint =
        metadata.operation === "ragu"
          ? "/api/exam/ragu-answer"
          : "/api/exam/save-answer";
      return api.patch(endpoint, payload);
    },
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
  const sheetIdRef = useRef(sheetId);
  sheetIdRef.current = sheetId;
  const [syncQueue] = useState(createSyncQueue);
  const [queueVersion, setQueueVersion] = useState(0);
  const refreshQueueState = useCallback(() => {
    setQueueVersion((version) => version + 1);
  }, []);
  const queueState = useMemo(
    () => ({
      ...syncQueue.queue.getState({ sheetId }),
      refreshVersion: queueVersion,
    }),
    [queueVersion, sheetId, syncQueue]
  );
  const [isFinalizing, setIsFinalizing] = useState(false);
  const finalizingRef = useRef(false);
  const deferredTimers = useRef(new Map());

  const flushAnswers = useCallback(async () => {
    try {
      const nextState = await syncQueue.queue.flush({
        sheetId: sheetIdRef.current,
      });
      refreshQueueState();
      return nextState;
    } finally {
      syncQueue.resetRetrySchedule();
    }
  }, [refreshQueueState, syncQueue]);

  const retryAnswers = useCallback(async () => {
    try {
      const nextState = await syncQueue.queue.retry({
        sheetId: sheetIdRef.current,
      });
      refreshQueueState();
      return nextState;
    } finally {
      syncQueue.resetRetrySchedule();
    }
  }, [refreshQueueState, syncQueue]);

  const scheduleDeferredFlush = useCallback(
    (queueKey, readyAt) => {
      const timers = deferredTimers.current;
      const existingTimer = timers.get(queueKey);
      if (existingTimer) {
        clearTimeout(existingTimer);
        timers.delete(queueKey);
      }

      const normalizedReadyAt =
        Number.isFinite(readyAt) && readyAt >= 0 ? readyAt : 0;
      const delay = Math.max(0, normalizedReadyAt - Date.now());
      if (delay === 0) {
        return;
      }

      const timer = setTimeout(() => {
        timers.delete(queueKey);
        void flushAnswers().catch((error) => {
          console.error("[useAnswerSync] Deferred flush failed", error);
        });
      }, delay);
      timers.set(queueKey, timer);
    },
    [flushAnswers]
  );

  const enqueueAnswer = useCallback(
    (payload, { operation = "save", readyAt = 0 } = {}) => {
      const activeSheetId = sheetIdRef.current;
      if (
        finalizingRef.current ||
        activeSheetId === null ||
        activeSheetId === undefined
      ) {
        if (activeSheetId === null || activeSheetId === undefined) {
          console.warn("[useAnswerSync] enqueueAnswer ignored: missing sheet id");
        }
        return syncQueue.queue.getState({ sheetId: activeSheetId });
      }

      syncQueue.queue.enqueue({
        sheetId: activeSheetId,
        payload,
        operation,
        readyAt,
      });
      refreshQueueState();
      scheduleDeferredFlush(
        `${activeSheetId}:${operation}:${payload.exam_soal_id}`,
        readyAt
      );
      void flushAnswers();
      return syncQueue.queue.getState({ sheetId: activeSheetId });
    },
    [flushAnswers, refreshQueueState, scheduleDeferredFlush, syncQueue]
  );

  const clearAnswers = useCallback(() => {
    if (sheetId === null || sheetId === undefined) {
      return syncQueue.queue.getState({ sheetId });
    }

    const timers = deferredTimers.current;
    for (const [key, timer] of timers) {
      if (key.startsWith(`${sheetId}:`)) {
        clearTimeout(timer);
        timers.delete(key);
      }
    }

    syncQueue.queue.clear(sheetId);
    const scopedState = syncQueue.queue.getState({ sheetId });
    refreshQueueState();
    return scopedState;
  }, [refreshQueueState, sheetId, syncQueue]);

  const beginFinalization = useCallback(() => {
    if (finalizingRef.current) {
      return false;
    }

    finalizingRef.current = true;
    setIsFinalizing(true);
    return true;
  }, []);

  const canEditAnswers = useCallback(() => !finalizingRef.current, []);

  const endFinalization = useCallback(() => {
    finalizingRef.current = false;
    setIsFinalizing(false);
  }, []);

  useEffect(() => {
    for (const entry of queueState.entries) {
      if (entry.readyAt > Date.now()) {
        scheduleDeferredFlush(
          `${entry.sheetId}:${entry.operation}:${entry.payload.exam_soal_id}`,
          entry.readyAt
        );
      }
    }
  }, [queueState.entries, scheduleDeferredFlush]);

  useEffect(() => {
    const timers = deferredTimers.current;
    const unsubscribe = syncQueue.queue.subscribe(refreshQueueState);
    return () => {
      unsubscribe();
      syncQueue.dispose();
      for (const timer of timers.values()) {
        clearTimeout(timer);
      }
      timers.clear();
    };
  }, [refreshQueueState, syncQueue]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    // Background recovery uses flush(), never retry(): validation failures
    // stay `failed` until the student changes the answer or explicitly
    // retries via retryAnswers() (manual button, sync-required, submit).
    const recoverAnswers = () => {
      void flushAnswers().catch((error) => {
        console.error("[useAnswerSync] Recovery failed", error);
      });
    };

    recoverAnswers();
    window.addEventListener("online", recoverAnswers);
    const intervalId = window.setInterval(recoverAnswers, FLUSH_INTERVAL_MS);

    return () => {
      window.removeEventListener("online", recoverAnswers);
      window.clearInterval(intervalId);
    };
  }, [flushAnswers]);

  const contextValue = useMemo(
    () => ({
      pendingCount: queueState.pendingCount,
      entries: queueState.entries,
      statusSummary: queueState.statusSummary,
      isFinalizing,
      enqueueAnswer,
      flushAnswers,
      retryAnswers,
      clearAnswers,
      beginFinalization,
      canEditAnswers,
      endFinalization,
    }),
    [
      beginFinalization,
      canEditAnswers,
      clearAnswers,
      endFinalization,
      enqueueAnswer,
      flushAnswers,
      isFinalizing,
      queueState,
      retryAnswers,
    ]
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
