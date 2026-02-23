import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useCallback, useState, useEffect, useMemo, useRef } from "react";
import { useExamInfo } from "../../store/useExamInfo";
import ExamUserInfo from "./ExamUserInfo";
import { getResult } from "../../lib/services/getResult";
import { toast } from "react-toastify";
import { useExamTime } from "../../store/useExamTime";
import { api } from "../../lib/hooks/auth";
import {
  getTrustedNowMs,
  parseServerTimeMs,
  resolveServerNowMs,
} from "../../lib/serverClock";

export default function NavHead() {
  return (
    <ExamUserInfo>
      <Timer />
    </ExamUserInfo>
  );
}

const Timer = () => {
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);

  const [remainingTimeMs, setRemainingTimeMs] = useState(0);
  const hasAutoSubmitted = useRef(false);

  const examInfo = useExamInfo((state) => state.examInfo);
  const setServerClock = useExamInfo((state) => state.setServerClock);
  const setSubmitable = useExamTime((state) => state.setSubmitable);

  const { end_time, server_now_ms, sync_perf_now } = examInfo;

  const endTimeMs = useMemo(() => {
    const parsed = parseServerTimeMs(end_time);
    return Number.isFinite(parsed) ? parsed : null;
  }, [end_time]);

  const syncServerClock = useCallback(async () => {
    await api
      .get("/api/user")
      .then((response) => {
        const nextServerNowMs = resolveServerNowMs(response);
        if (!Number.isFinite(nextServerNowMs)) {
          return;
        }

        const nextSyncPerfNow =
          typeof performance !== "undefined" ? performance.now() : null;

        setServerClock({
          server_now_ms: nextServerNowMs,
          sync_perf_now: nextSyncPerfNow,
        });
      })
      .catch(() => null);
  }, [setServerClock]);

  const handleInterval = useCallback(() => {
    if (!Number.isFinite(endTimeMs)) {
      setRemainingTimeMs(0);
      return;
    }

    const trustedNowMs = getTrustedNowMs({
      serverNowMs: server_now_ms,
      syncPerfNow: sync_perf_now,
    });

    if (!Number.isFinite(trustedNowMs)) {
      setRemainingTimeMs(0);
      return;
    }

    setRemainingTimeMs(endTimeMs - trustedNowMs);
  }, [endTimeMs, server_now_ms, sync_perf_now]);

  // listening to interval event
  useEffect(() => {
    handleInterval();

    const timer = setInterval(() => {
      handleInterval();
    }, 1000);

    return () => clearInterval(timer);
  }, [handleInterval]);

  useEffect(() => {
    syncServerClock();

    const syncTimer = setInterval(syncServerClock, 60000);

    return () => clearInterval(syncTimer);
  }, [syncServerClock]);

  useEffect(() => {
    if (!Number.isFinite(server_now_ms) || !Number.isFinite(sync_perf_now)) {
      setSubmitable(false);
      return;
    }

    const withinSubmitWindow = remainingTimeMs <= 15 * 60 * 1000;
    setSubmitable(withinSubmitWindow);
  }, [remainingTimeMs, server_now_ms, sync_perf_now, setSubmitable]);

  useEffect(() => {
    const sheetId = savedAnswers?.[0]?.exam_answer_sheet_id;
    if (
      hasAutoSubmitted.current ||
      !sheetId ||
      !Number.isFinite(server_now_ms) ||
      !Number.isFinite(sync_perf_now)
    ) {
      return;
    }

    if (remainingTimeMs <= 2000) {
      hasAutoSubmitted.current = true;
      getResult(sheetId).then(() => {
        toast.success("ujian di selesaikan");
      });
    }
  }, [remainingTimeMs, savedAnswers, server_now_ms, sync_perf_now]);

  const [hour, min, sec] = useMemo(() => {
    const displayMs = Math.max(0, remainingTimeMs);
    const nextHour = Math.floor((displayMs / 3600000) % 24);
    const nextMin = Math.floor((displayMs / 60000) % 60);
    const nextSec = Math.floor((displayMs / 1000) % 60);
    return [nextHour, nextMin, nextSec];
  }, [remainingTimeMs]);



  return (
    <div
      className={`rounded-xl text-xs shadow-2xl px-4 py-1 font-semibold ${
        hour === 0 && min <= 5 ? "bg-red-700 text-white" : "bg-white"
      }`}
    >
      sisa waktu: {`${hour}j ${min}m ${sec}d`}
    </div>
  );
};
