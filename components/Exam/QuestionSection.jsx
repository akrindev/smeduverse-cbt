import { useState, useEffect, useCallback } from "react";
import { ThreeDots } from "../Loading";
import QuestionOption from "../QuestionOption";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useAnswerSync } from "../../lib/hooks/useAnswerSync";
import find from "lodash/find";

const QuestionSection = () => {
  const [question, setQuestion] = useState({});
  const [chosenAnswer, setChosenAnswer] = useState(null);
  const [initiating, setInitiating] = useState(true);
  const [contentAnswer, setContentAnswer] = useState("");

  const questions = useExamQuestions((state) => state.questions);
  const questionIndex = useExamQuestions((state) => state.questionIndex);
  const setQuestionIndex = useExamQuestions((state) => state.setQuestionIndex);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);
  const updateChosenAnswer = useSavedAnswers((state) => state.setChosenAnswer);
  const { entries, enqueueAnswer } = useAnswerSync();

  const handleChosen = useCallback(
    (value) => {
      const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id);
      if (!answer) {
        return;
      }

      const nextAnswer = { ...answer, answer_chosen_id: value };
      updateChosenAnswer(nextAnswer);
      enqueueAnswer({
        exam_answer_sheet_id: answer.exam_answer_sheet_id,
        exam_soal_id: answer.exam_soal_id,
        answer_chosen_id: value,
      });
    },
    [enqueueAnswer, question.id, savedAnswers, updateChosenAnswer]
  );

  const handleContentChange = useCallback(
    (value) => {
      setContentAnswer(value);

      const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id);
      if (answer) {
        updateChosenAnswer({ ...answer, content: value });
      }
    },
    [question.id, savedAnswers, updateChosenAnswer]
  );

  const handleContentAnswer = useCallback(
    (value) => {
      const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id);
      if (!answer) {
        return;
      }

      enqueueAnswer({
        exam_answer_sheet_id: answer.exam_answer_sheet_id,
        exam_soal_id: answer.exam_soal_id,
        content: value,
      });
    },
    [enqueueAnswer, question.id, savedAnswers]
  );

  const handleRagu = useCallback(() => {
    const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id);
    if (!answer) {
      return;
    }

    const ragu = answer.ragu === 1 ? 0 : 1;
    const nextAnswer = { ...answer, ragu };
    updateChosenAnswer(nextAnswer);
    enqueueAnswer({
      exam_answer_sheet_id: answer.exam_answer_sheet_id,
      exam_soal_id: answer.exam_soal_id,
      ragu,
    });
  }, [enqueueAnswer, question.id, savedAnswers, updateChosenAnswer]);

  const isRagu = useCallback(
    (chosenId) =>
      find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu === 1,
    [savedAnswers]
  );

  const questionEntry = entries.find(
    (entry) => entry.payload.exam_soal_id === question.id
  );
  const syncStatus = questionEntry?.status;
  const isSynchronizing = syncStatus === "saving" || syncStatus === "syncing";

  const syncLabel = {
    saving: "menyimpan jawaban",
    syncing: "menyinkronkan jawaban",
    queued: "jawaban menunggu sinkronisasi",
    failed: "jawaban gagal disinkronkan",
  }[syncStatus];

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

  // Queue text answers after the existing one-second input delay.
  useEffect(() => {
    const timeout = setTimeout(() => {
      handleContentAnswer(contentAnswer);
    }, 1000);
    return () => clearTimeout(timeout);
  }, [contentAnswer, handleContentAnswer]);

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
          <div className="text-xs rounded-lg text-green-800 bg-green-100 flex items-center justify-center space-x-2 py-1 px-3">
            {isSynchronizing && <ThreeDots />} {syncLabel}
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
            />
          </div>
        )}

        {question?.type === 2 && (
          <div>
            {/* styling teaxtare */}
            <textarea
              className={`w-full h-40 p-3 rounded-lg border ${
                isSynchronizing ? "border-green-200" : "border-sky-400"
              }`}
              placeholder="Tulis jawabanmu disini"
              value={contentAnswer}
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
            onClick={() => setQuestionIndex(questionIndex - 1)}
            className="p-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50"
            disabled={questionIndex === 0}
          >
            Soal sebelumnya
          </button>
          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button
            className={`px-3 py-2 ${
              questions && isRagu(question.id)
                ? "bg-yellow-500 text-gray-100"
                : "bg-white text-yellow-500"
            } border border-yellow-600  text-xs rounded-md`}
            onClick={handleRagu}
          >
            Ragu-ragu
          </button>
          {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
          <button
            onClick={() => setQuestionIndex(questionIndex + 1)}
            className="px-3 py-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50"
            disabled={questions && questionIndex === questions.length - 1}
          >
            Soal berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSection;
