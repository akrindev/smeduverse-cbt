import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useState, useEffect, useMemo, useRef } from "react";
import { useExamInfo } from "../../store/useExamInfo";
import ExamUserInfo from "./ExamUserInfo";
import { getResult } from "../../lib/services/getResult";
import { toast } from "react-toastify";
import { useExamTime } from "../../store/useExamTime";
import { getTrustedNowMs, parseServerTimeMs } from "../../lib/serverClock";

export default function NavHead() {
  return (
    <ExamUserInfo>
      <Timer />
    </ExamUserInfo>
  );
}

const Timer = () => {
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);

  const [remainingTimeMs, setRemainingTimeMs] = useState(null);
  const [trustedNowMs, setTrustedNowMs] = useState(null);
  const [fallbackNowMs, setFallbackNowMs] = useState(() => Date.now());
  const hasAutoSubmitted = useRef(false);

  const examInfo = useExamInfo((state) => state.examInfo);
  const setSubmitable = useExamTime((state) => state.setSubmitable);

  const { end_time, server_now_ms, sync_perf_now } = examInfo;

  const endTimeMs = useMemo(() => {
    const parsed = parseServerTimeMs(end_time);
    return Number.isFinite(parsed) ? parsed : null;
  }, [end_time]);

  const effectiveNowMs = Number.isFinite(trustedNowMs)
    ? trustedNowMs
    : fallbackNowMs;

  useEffect(() => {
    if (!Number.isFinite(endTimeMs) || !Number.isFinite(effectiveNowMs)) {
      setRemainingTimeMs(null);
      return;
    }

    setRemainingTimeMs(endTimeMs - effectiveNowMs);
  }, [endTimeMs, effectiveNowMs]);

  useEffect(() => {
    const syncedNowMs = getTrustedNowMs({
      serverNowMs: server_now_ms,
      syncPerfNow: sync_perf_now,
    });

    setTrustedNowMs(
      Number.isFinite(syncedNowMs)
        ? syncedNowMs
        : Number.isFinite(server_now_ms)
          ? server_now_ms
          : null
    );
  }, [server_now_ms, sync_perf_now]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTrustedNowMs((prev) => (Number.isFinite(prev) ? prev + 1000 : prev));
      setFallbackNowMs(Date.now());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!Number.isFinite(effectiveNowMs) || !Number.isFinite(remainingTimeMs)) {
      setSubmitable(false);
      return;
    }

    const withinSubmitWindow = remainingTimeMs <= 15 * 60 * 1000;
    setSubmitable(withinSubmitWindow);
  }, [remainingTimeMs, effectiveNowMs, setSubmitable]);

  useEffect(() => {
    const sheetId = savedAnswers?.[0]?.exam_answer_sheet_id;
    if (
      hasAutoSubmitted.current ||
      !sheetId ||
      !Number.isFinite(endTimeMs) ||
      !Number.isFinite(effectiveNowMs) ||
      !Number.isFinite(remainingTimeMs)
    ) {
      return;
    }

    if (remainingTimeMs <= 2000) {
      hasAutoSubmitted.current = true;
      getResult(sheetId).then(() => {
        toast.success("ujian di selesaikan");
      });
    }
  }, [remainingTimeMs, savedAnswers, effectiveNowMs, endTimeMs]);

  const [hour, min, sec] = useMemo(() => {
    const safeRemainingMs = Number.isFinite(remainingTimeMs) ? remainingTimeMs : 0;
    const displayMs = Math.max(0, safeRemainingMs);
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
      {Number.isFinite(remainingTimeMs)
        ? `sisa waktu: ${hour}j ${min}m ${sec}d`
        : "sisa waktu: sinkronisasi waktu..."}
    </div>
  );
};
