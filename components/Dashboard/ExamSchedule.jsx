import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { ArrowLeft, Clock3, FileText, Sparkles, X } from "lucide-react";

import { ToastContainer, toast } from "react-toastify";

import { api } from "../../lib/hooks/auth";
import { ThreeDots } from "../Loading";

import { toDate } from "../../lib/todate";
import Modal from "../Dialog";
import ButtonKerjakan from "../ButtonKerjakan";
import ButtonExamPage from "./ButtonExamPage";
import DescriptionModalExam from "../DescriptionModalExam";
import {
  getTrustedNowMs,
  parseServerTimeMs,
  resolveServerNowMs,
} from "../../lib/serverClock";

export default function ExamSchedule({ planId, onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsloading] = useState("idle");
  const [serverNowMs, setServerNowMs] = useState(null);
  const [syncPerfNow, setSyncPerfNow] = useState(null);

  useEffect(() => {
    const getExamSchedule = async () => {
      setIsloading("loading");

      await api
        .get(`/api/exam/schedule-list/${planId}`)
        .then((res) => {
          const nowMs = resolveServerNowMs(res);
          const perfNow =
            typeof performance !== "undefined" ? performance.now() : null;

          if (Number.isFinite(nowMs) && Number.isFinite(perfNow)) {
            setServerNowMs(nowMs);
            setSyncPerfNow(perfNow);
          }

          setSchedules(res.data?.ujian_schedule);
        })
        .catch((err) => {
          toast.error(err.response?.data?.message, {
            hideProgressBar: true,
            position: "top-left",
          });
        })
        .finally(() => setIsloading("idle"));
    };

    getExamSchedule();
  }, [planId]);

  return (
    <div className="">
      <header className="flex flex-col px-5 py-4 border-b border-gray-100">
        {/* biome-ignore lint/a11y/useKeyWithClickEvents: <explanation> */}
        <div
          className="flex items-center space-x-2 cursor-pointer hover:opacity-40"
          onClick={onBack}
        >
          <ArrowLeft
            size={16}
            strokeWidth={2}
            aria-hidden="true"
          />
          <span>kembali</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-800">Jadwal Ujian</h1>
      </header>

      {schedules && schedules.length > 0 ? (
        <ScheduleCard
          schedules={schedules}
          serverNowMs={serverNowMs}
          syncPerfNow={syncPerfNow}
        />
      ) : (
        <div className="px-5 py-4">
          {isLoading ? (
            <ThreeDots />
          ) : (
            <p className="text-gray-800">Belum ada jadwal ujian</p>
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

function ScheduleCard({ schedules, serverNowMs, syncPerfNow }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [fallbackNowMs, setFallbackNowMs] = useState(null);

  const trustedNowMs = getTrustedNowMs({ serverNowMs, syncPerfNow });
  const effectiveNowMs = Number.isFinite(trustedNowMs)
    ? trustedNowMs
    : fallbackNowMs;

  useEffect(() => {
    setFallbackNowMs(Date.now());
    const interval = setInterval(() => {
      setFallbackNowMs(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleSelectSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setIsOpen(true);
  };

  return (
    <>
      <div
        className={`
        grid grid-cols-12 gap-3 px-3
      `}
      >
        {schedules?.map((schedule) => {
          const scheduleEndTimeMs = parseServerTimeMs(schedule.end_time);
          const isEnded =
            Number.isFinite(scheduleEndTimeMs) &&
            scheduleEndTimeMs < effectiveNowMs;

          return (
            <div
              key={schedule.id}
              className="col-span-12 md:col-span-6 xl:col-span-4"
            >
            <div
              className={`
              flex flex-col items-start
               p-3 md:p-5
               border border-transparent
              ${
                isEnded
                  ? "bg-slate-50/90 bg-opacity-95 cursor-not-allowed rounded-t"
                  : `bg-white
                  hover:bg-green-100/95
                  rounded-t`
              }
            `}
            >
              <div className={"font-semibold"}>{schedule.paket.name}</div>
              <div className={"text-sm text-gray-600"}>
                {schedule.paket.mapel.nama} . {schedule.exam_plan.name}
              </div>
              <div
                className={"flex items-center space-x-2 text-sm text-gray-600"}
              >
                <div className="flex items-center space-x-2">
                  <FileText
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>{schedule.paket.soal_count} soal</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Sparkles
                    size={16}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>{schedule.paket.kkm} KKM</span>
                </div>
              </div>
              {schedule.warn_enabled ? (
                <div className="text-xs text-rose-600 italic">
                  peringatan aktif
                </div>
              ) : null}
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <div className="flex items-center space-x-1">
                  <Clock3
                    size={12}
                    strokeWidth={2}
                    aria-hidden="true"
                  />
                  <span>{toDate(schedule.start_time)}</span>
                  <X size={12} strokeWidth={2} aria-hidden="true" />
                  <span>{toDate(schedule.end_time)}</span>
                </div>
              </div>
            </div>
            <ButtonKerjakan
              onClick={() => handleSelectSchedule(schedule)}
              schedule={schedule}
              trustedNowMs={effectiveNowMs}
            />
            </div>
          );
        })}
      </div>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title="Informasi Ujian"
        description={
          selectedSchedule ? (
            <DescriptionModalExam data={selectedSchedule} />
          ) : (
            <div className="text-sm text-gray-500">memuat informasi ujian...</div>
          )
        }
        action={
          selectedSchedule ? (
            <ButtonExamPage token={selectedSchedule.token} />
          ) : null
        }
      />
    </>
  );
}
