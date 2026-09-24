import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import NavButirSoal from "./NavButirSoal";
import find from "lodash/find";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useExamInfo } from "../../store/useExamInfo";
import Modal from "../Dialog";
import { submitExam } from "../../lib/services/submitExam";
import { useAnswerSync } from "../../lib/hooks/useAnswerSync";
import { useExamSecurity } from "../../lib/hooks/useExamSecurity";
import { loaderImg } from "../../lib/loaderImg";
import filter from "lodash/filter";
import { useExamTime } from "../../store/useExamTime";

const NavigasiSoal = ({ allowExit } = {}) => {
  const questions = useExamQuestions((state) => state.questions);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);
  const examInfo = useExamInfo((state) => state.examInfo);
  const setQuestionIndex = useExamQuestions((state) => state.setQuestionIndex);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  // state for initiate
  const [initiating, setInitiating] = useState(true);

  const [canSubmit, setCanSubmit] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const {
    pendingCount,
    entries,
    isFinalizing,
    retryAnswers,
    clearAnswers,
    beginFinalization,
    endFinalization,
  } = useAnswerSync();

  const submitable = useExamTime((state) => state.submitable);
  const { allowExit: securityAllowExit } = useExamSecurity();
  const effectiveAllowExit = securityAllowExit ?? allowExit;
  const hasFailedEntries = entries.some((entry) => entry.status === "failed");
  const hasRetryableEntries = entries.some(
    (entry) =>
      entry.status === "failed" ||
      (entry.status === "queued" && entry.attempts >= 3)
  );

  const handleSyncRequired = useCallback(() => {
    toast.info(
      "Jawaban masih menunggu sinkronisasi. Silakan coba lagi sebentar."
    );
    void retryAnswers().catch((error) => {
      console.error("[exam] Answer recovery failed", error);
    });
  }, [retryAnswers]);

  const handleRetry = useCallback(async () => {
    if (isRetrying || isFinalizing) {
      return;
    }

    setIsRetrying(true);
    try {
      await retryAnswers();
    } catch (error) {
      console.error("[exam] Manual answer retry failed", error);
    } finally {
      setIsRetrying(false);
    }
  }, [isFinalizing, isRetrying, retryAnswers]);

  const stopExam = () => {
    if (isFinalizing || (canSubmit && !submitable)) {
      return;
    }

    setIsOpenDialog(true);
  };

  const isChosen = useCallback(
    (chosenId) => {
      const chosen = find(
        savedAnswers,
        (item) => item.exam_soal_id === chosenId
      );

      return chosen.answer_chosen_id != null || chosen.content != null;
    },
    [savedAnswers]
  );

  const isRagu = useCallback(
    (chosenId) => {
      return (
        find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu === 1
      );
    },
    [savedAnswers]
  );

  // use effect for initiate
  useEffect(() => {
    if (questions && questions.length > 0) {
      setInitiating(false);
    }

    const time = setTimeout(() => {
      setCanSubmit(submitable ? true : false);
    }, 2000);

    return () => clearTimeout(time);
  }, [questions, submitable]);

  return (
    !initiating && (
      <>
        <div className="col-span-12 lg:col-span-4">
          <div className="p-4 bg-white rounded shadow">
            <div className="font-bold text-base mb-5">Navigasi Soal</div>
            <div className="grid grid-cols-10 gap-2 w-full mx-auto">
              {questions?.map((question, index) => (
                <NavButirSoal
                  key={question.id}
                  isChosen={isChosen(question.id)}
                  isRagu={isRagu(question.id)}
                  onClick={() => setQuestionIndex(index)}
                  number={index + 1}
                />
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              {canSubmit ? (
                // biome-ignore lint/a11y/useButtonType: <explanation>
                <button
                  className="bg-gray-200 text-sm px-4 py-1 rounded-lg border border-gray-500 font-medium disabled:opacity-50"
                  onClick={stopExam}
                  disabled={isFinalizing}
                >
                  Hentikan Ujian
                </button>
              ) : (
                <span className="text-gray-400 text-xs">
                  ujian dapat dikumpulkan 15 menit sebelum ujian berakhir
                </span>
              )}
            </div>
            {pendingCount > 0 && (
              <div className="mt-2 text-right">
                <p
                  className={`text-xs ${
                    hasFailedEntries ? "text-red-700" : "text-amber-700"
                  }`}
                >
                  {hasFailedEntries
                    ? "Beberapa jawaban gagal disinkronkan."
                    : "Jawaban masih menunggu sinkronisasi."}
                </p>
                {hasRetryableEntries && (
                  <button
                    className="mt-1 text-xs text-blue-700 underline disabled:opacity-50"
                    onClick={handleRetry}
                    disabled={isRetrying || isFinalizing}
                  >
                    {isRetrying ? "Mengulang sinkronisasi..." : "Coba sinkronkan ulang"}
                  </button>
                )}
              </div>
            )}
            <div className="mt-3">
              <div className="flex flex-col items-start">
                <div className="flex items-center space-x-3">
                  <div className="h-2 w-2 bg-green-500 rounded" />
                  <span className="text-xs text-gray-600">
                    soal telah dijawab
                  </span>
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="h-2 w-2 bg-yellow-500 rounded" />
                  <span className="text-xs text-gray-600">ragu-ragu</span>
                </div>
                <div className="flex items-center space-x-3 mt-1">
                  <div className="h-2 w-2 bg-gray-700 rounded" />
                  <span className="text-xs text-gray-600">belum dijawab</span>
                </div>

                {examInfo.warnEnabled && (
                  <div className="flex items-center mt-5 text-xs font-medium">
                    <div className="text-red-600 mr-1">Peringatan</div>
                    <span className="text-xs text-red-900 font-bold">
                      {examInfo?.warn}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <Modal
          isOpen={isOpenDialog}
          setIsOpen={setIsOpenDialog}
          title={"Yakin udah selesai?"}
          description={<ChosenAnswer answers={savedAnswers} />}
          action={
            savedAnswers && (
              <ButtonResult
                sheetId={savedAnswers[0]?.exam_answer_sheet_id}
                pendingCount={pendingCount}
                retryAnswers={retryAnswers}
                onSyncRequired={handleSyncRequired}
                allowExit={effectiveAllowExit}
                isFinalizing={isFinalizing}
                beginFinalization={beginFinalization}
                endFinalization={endFinalization}
                clearAnswers={clearAnswers}
              />
            )
          }
        />
      </>
    )
  );
};

function ButtonResult({
  sheetId,
  pendingCount,
  retryAnswers,
  onSyncRequired,
  allowExit,
  isFinalizing,
  beginFinalization,
  endFinalization,
  clearAnswers,
}) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isFinalizing) {
      return;
    }
    if (pendingCount > 0) {
      onSyncRequired?.();
      return;
    }

    setIsLoading(true);

    try {
      // Submit intentionally uses the explicit retry entry point (not the
      // background flush) so terminal/exhausted entries get one fresh cycle.
      const result = await submitExam({
        sheetId,
        flushAnswers: retryAnswers,
        allowExit,
        onBlocked: onSyncRequired,
        onStart: beginFinalization,
        onFinish: endFinalization,
        clearAnswers,
      });

      if (result.reason === "error") {
        toast.error("Ujian tidak dapat dikumpulkan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
      <button
        className={
          "bg-green-500 text-white rounded-md px-4 py-1 disabled:opacity-60"
        }
        disabled={isLoading || isFinalizing || pendingCount > 0}
        onClick={handleClick}
      >
        {isLoading ? "Mengumpulkan" : "Kumpulkan"}
      </button>
    </>
  );
}

function ChosenAnswer({ answers }) {
  // get chosen answer where answer_chosen_id is not null
  const chosenAnswer =
    filter(answers, (answer) => answer.answer_chosen_id != null).length || 0;
  const emptyAnswer =
    filter(answers, (answer) => answer.answer_chosen_id == null).length || 0;

  return (
    <>
      <div>
        <div className="flex items-center justify-center mb-5">
          <Image
            loader={loaderImg}
            src={"/assets/images/yay.png"}
            width={160}
            height={160}
            alt="yay"
            unoptimized
          />
        </div>
        <span>Pastikan untuk mengoreksi sebelum menyelesaikan ujian 🎉</span>
        <div className="divide-black my-5" />
        <div className="flex items-center space-x-3 w-full">
          <div className="flex flex-col items-center w-full">
            <strong>Dijawab</strong>
            <span>{chosenAnswer}</span>
          </div>
          <div className="flex flex-col items-center w-full">
            <strong>Kosong</strong>
            <span>{emptyAnswer}</span>
          </div>
          <div className="flex flex-col items-center w-full">
            <strong>Total</strong>
            <span>{answers.length}</span>
          </div>
        </div>
        <div className="divide-black my-5" />
      </div>
    </>
  );
}

export default NavigasiSoal;
