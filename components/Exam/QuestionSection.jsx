import { useState, useEffect, useCallback } from "react";
import { ThreeDots } from "../Loading";
import QuestionOption from "../QuestionOption";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useAnswerSync } from "../../lib/hooks/useAnswerSync";
import find from "lodash/find";

const getQuestionEntry = (entries, questionId) => {
  const statusPriority = {
    failed: 4,
    queued: 3,
    syncing: 2,
    saving: 1,
  };

  return entries
    .filter((entry) => entry.payload.exam_soal_id === questionId)
    .sort(
      (left, right) =>
        (statusPriority[right.status] ?? 0) - (statusPriority[left.status] ?? 0)
    )[0];
};

const QuestionSection = () => {
  const [question, setQuestion] = useState({});
  const [chosenAnswer, setChosenAnswer] = useState(null);
  const [initiating, setInitiating] = useState(true);
  const [contentAnswer, setContentAnswer] = useState("");
  const [syncClock, setSyncClock] = useState(() => Date.now());

  const questions = useExamQuestions((state) => state.questions);
  const questionIndex = useExamQuestions((state) => state.questionIndex);
  const setQuestionIndex = useExamQuestions((state) => state.setQuestionIndex);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);
  const updateChosenAnswer = useSavedAnswers((state) => state.setChosenAnswer);
  const {
    entries,
    enqueueAnswer,
    isFinalizing,
    canEditAnswers,
  } = useAnswerSync();

  const handleChosen = useCallback(
    (value) => {
      if (isFinalizing || !canEditAnswers()) {
        return;
      }

      const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id);
      if (!answer) {
        return;
      }

      const nextAnswer = { ...answer, answer_chosen_id: value };
      updateChosenAnswer(nextAnswer);
      enqueueAnswer(
        {
          exam_answer_sheet_id: answer.exam_answer_sheet_id,
          exam_soal_id: answer.exam_soal_id,
          answer_chosen_id: value,
        },
        { operation: "save" }
      );
    },
    [
      canEditAnswers,
      enqueueAnswer,
      isFinalizing,
      question.id,
      savedAnswers,
      updateChosenAnswer,
    ]
  );

  const handleContentAnswer = useCallback(
    (value) => {
      if (isFinalizing || !canEditAnswers()) {
        return;
      }

      const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id);
      if (!answer) {
        return;
      }

      // Queue immediately, but defer the sender until the one-second debounce.
      enqueueAnswer(
        {
          exam_answer_sheet_id: answer.exam_answer_sheet_id,
          exam_soal_id: answer.exam_soal_id,
          content: value,
        },
        { operation: "save", readyAt: Date.now() + 1_000 }
      );
    },
    [
      canEditAnswers,
      enqueueAnswer,
      isFinalizing,
      question.id,
      savedAnswers,
    ]
  );

  const handleContentChange = useCallback(
    (value) => {
      if (isFinalizing || !canEditAnswers()) {
        return;
      }

      setContentAnswer(value);

      const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id);
      if (!answer) {
        return;
      }

      const nextAnswer = { ...answer, content: value };
      updateChosenAnswer(nextAnswer);
      handleContentAnswer(value);
    },
    [
      canEditAnswers,
      handleContentAnswer,
      isFinalizing,
      question.id,
      savedAnswers,
      updateChosenAnswer,
    ]
  );

  const handleRagu = useCallback(() => {
    if (isFinalizing || !canEditAnswers()) {
      return;
    }

    const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id);
    if (!answer) {
      return;
    }

    const ragu = answer.ragu === 1 ? 0 : 1;
    const nextAnswer = { ...answer, ragu };
    updateChosenAnswer(nextAnswer);
    enqueueAnswer(
      {
        exam_answer_sheet_id: answer.exam_answer_sheet_id,
        exam_soal_id: answer.exam_soal_id,
        ragu,
      },
      { operation: "ragu" }
    );
  }, [
    canEditAnswers,
    enqueueAnswer,
    isFinalizing,
    question.id,
    savedAnswers,
    updateChosenAnswer,
  ]);

  const isRagu = useCallback(
    (chosenId) =>
      find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu === 1,
    [savedAnswers]
  );

  const questionEntry = getQuestionEntry(entries, question.id);
  const syncStatus = questionEntry?.status;
  const isDeferred = Boolean(
    questionEntry?.readyAt && questionEntry.readyAt > syncClock
  );
  const isSynchronizing = syncStatus === "saving" || syncStatus === "syncing";
  const isTerminalQueued =
    syncStatus === "queued" && questionEntry?.attempts >= 3;
  const isRetrying =
    questionEntry?.attempts > 1 &&
    !isTerminalQueued &&
    (syncStatus === "saving" || syncStatus === "syncing" || syncStatus === "queued");

  const syncLabel = isDeferred
    ? "jawaban menunggu jeda sinkronisasi"
    : isRetrying
      ? "mengulang sinkronisasi..."
      : syncStatus === "saving"
        ? "menyimpan jawaban"
        : syncStatus === "syncing"
          ? "menyinkronkan jawaban"
          : isTerminalQueued
            ? "sinkronisasi tertunda — coba lagi"
            : syncStatus === "queued"
              ? "jawaban menunggu sinkronisasi"
              : syncStatus === "failed"
                ? "jawaban gagal disinkronkan"
                : null;
  const syncError =
    syncStatus === "failed" && questionEntry?.lastError
      ? `: ${questionEntry.lastError}`
      : "";
  const syncTone =
    syncStatus === "failed"
      ? "text-red-800 bg-red-100"
      : isDeferred || syncStatus === "queued" || isTerminalQueued
        ? "text-amber-900 bg-amber-100"
        : "text-blue-800 bg-blue-100";

  const dangerHTML = () => {
    return {
      __html: question?.question ?? "",
    };
  };

  const blockCopyEvent = (event) => {
    event.preventDefault();
  };

  const protectedContentProps = {
    "data-exam-protected": "true",
    onCopy: blockCopyEvent,
    onCut: blockCopyEvent,
    onContextMenu: blockCopyEvent,
    onDragStart: blockCopyEvent,
  };

  useEffect(() => {
    const clock = setInterval(() => setSyncClock(Date.now()), 1_000);
    return () => clearInterval(clock);
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // set initiating to false
    setInitiating(false);

    if (questions && questions.length > 0) {
      const currentQuestion = questions[questionIndex] || {};
      setQuestion(currentQuestion);

      const chosen = find(savedAnswers, { exam_soal_id: currentQuestion?.id });
      setChosenAnswer(chosen || null);
      setContentAnswer(chosen?.content || "");
    }

    return () => {
      setInitiating(true);
    };
  }, [questionIndex, questions, savedAnswers]);

  const changeQuestionIndex = useCallback(
    (nextIndex) => {
      if (canEditAnswers()) {
        setQuestionIndex(nextIndex);
      }
    },
    [canEditAnswers, setQuestionIndex]
  );

  return (
    <div className="bg-white rounded shadow">
      {/* header info */}
      <div className="flex items-center p-3 border-b border-gray-200 font-nunito font-semibold text-lg">
        {!initiating && (
          <div className="mr-auto py-1">
            Soal {questionIndex + 1 || 0} / {questions.length || 0}
          </div>
        )}
        {syncLabel && (
          <div
            className={`text-xs rounded-lg flex items-center justify-center space-x-2 py-1 px-3 ${syncTone}`}
          >
            {isSynchronizing && <ThreeDots />} {syncLabel}
            {syncError}
          </div>
        )}
      </div>

      {/* jika terdapat audio maka tampilkan audio */}
      {question?.audio && (
        <div className="flex items-center p-3 border-b border-gray-200 font-nunito font-semibold text-lg">
          <div className="mr-auto py-1">
            {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
            <audio controls>
              <source src={question?.audio.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )}

      {/* pertanyaan */}
      <div {...protectedContentProps}>
        <div
          className="px-4 py-3 font-roboto font-normal text-sm break-words select-none"
          style={{
            WebkitUserSelect: "none",
            WebkitTouchCallout: "none",
            userSelect: "none",
          }}
          // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
          dangerouslySetInnerHTML={dangerHTML()}
        />
      </div>

      <div className="border-b border-gray-100" />

      <div className="p-3">
        {question?.type === 1 && (
          <div {...protectedContentProps}>
            <QuestionOption
              data={question.choices}
              chosen={chosenAnswer}
              onChosen={handleChosen}
              isSaving={isFinalizing}
            />
          </div>
        )}

        {question?.type === 2 && (
          <div>
            {/* styling teaxtare */}
            <textarea
              className={`w-full h-40 p-3 rounded-lg border ${
                isSynchronizing ? "border-green-200" : "border-sky-400"
              } disabled:opacity-60`}
              placeholder="Tulis jawabanmu disini"
              value={contentAnswer}
              disabled={isFinalizing}
              onChange={(e) => handleContentChange(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* navigasi */}
      <div className="p-3 pb-5" key={question.id}>
        <div className="flex items-center justify-between">
          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button
            onClick={() => changeQuestionIndex(questionIndex - 1)}
            className="p-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50"
            disabled={isFinalizing || questionIndex === 0}
          >
            Soal sebelumnya
          </button>
          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button
            className={`px-3 py-2 ${
              questions && isRagu(question.id)
                ? "bg-yellow-500 text-gray-100"
                : "bg-white text-yellow-500"
            } border border-yellow-600  text-xs rounded-md disabled:opacity-50`}
            onClick={handleRagu}
            disabled={isFinalizing}
          >
            Ragu-ragu
          </button>
          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button
            onClick={() => changeQuestionIndex(questionIndex + 1)}
            className="px-3 py-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50"
            disabled={isFinalizing || (questions && questionIndex === questions.length - 1)}
          >
            Soal berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSection;
