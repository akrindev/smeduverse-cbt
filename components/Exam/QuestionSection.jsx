import { useState, useEffect, useCallback } from "react";
import { ThreeDots } from "../Loading";
import QuestionOption from "../QuestionOption";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { api } from "../../lib/hooks/auth";
import find from "lodash/find";

import { ToastContainer, toast } from "react-toastify";

const QuestionSection = () => {
  const [question, setQuestion] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [chosenAnswer, setChosenAnswer] = useState(null);

  const questions = useExamQuestions((state) => state.questions);
  const questionIndex = useExamQuestions((state) => state.questionIndex);
  const setQuestionIndex = useExamQuestions((state) => state.setQuestionIndex);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);
  const updateChosenAnswer = useSavedAnswers((state) => state.setChosenAnswer);

  const handleChosen = async (value) => {
    setIsSaving(true);
    // update saved answers
    const answer = savedAnswers.find(
      (item) => item.exam_soal_id === question.id
    );
    answer.answer_chosen_id = value;

    try {
      await api
        .patch("/api/exam/save-answer", {
          exam_answer_sheet_id: answer.exam_answer_sheet_id,
          exam_soal_id: answer.exam_soal_id,
          answer_chosen_id: value,
        })
        .then((res) => {
          if (res.status === 200) {
            updateChosenAnswer(answer);
            // console.log(answer);
          }
        })
        .catch((err) => {
          console.log(err);
          toast.error("jawaban gagal disimpan, ulangi kembali");
        })
        .finally(() => {
          setIsSaving(false);
        });
    } catch (error) {
      console.log("catch", error);
    }
  };

  const handleRagu = async (value) => {
    setIsSaving(true);
    // update saved answers
    const answer = find(
      savedAnswers,
      (item) => item.exam_soal_id === question.id
    );
    answer.ragu = answer.ragu === 1 ? 0 : 1;

    await api
      .patch("/api/exam/ragu-answer", {
        exam_answer_sheet_id: answer.exam_answer_sheet_id,
        exam_soal_id: answer.exam_soal_id,
        ragu: answer.ragu,
      })
      .then((res) => {
        if (res.status === 200) {
          updateChosenAnswer(answer);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setIsSaving(false);
      });
  };

  const isRagu = useCallback(
    (chosenId) =>
      find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu == 1,
    [savedAnswers]
  );

  const dangerHTML = () => {
    return {
      __html: question?.question ?? "",
    };
  };

  useEffect(() => {
    const getChosenAnswer = () => {
      const chosen = find(savedAnswers, { exam_soal_id: question?.id });

      setChosenAnswer(chosen);
    };

    if (questions && questions.length > 0) {
      setQuestion(questions[questionIndex]);
      getChosenAnswer();
    }
  }, [questionIndex, question, questions, savedAnswers]);

  return (
    <div className="bg-white rounded shadow">
      {/* header info */}
      <div className="flex items-center p-3 border-b border-gray-200 font-nunito font-semibold text-lg">
        <div className="mr-auto py-1">
          {questions && (
            <>
              Soal {questionIndex + 1} / {questions.length}
            </>
          )}
        </div>
        {isSaving && (
          <div className="text-xs rounded-lg text-green-800 bg-green-100 flex items-center justify-center space-x-2 py-1 px-3">
            <ThreeDots /> menyimpan jawaban
          </div>
        )}
      </div>

      {/* jika terdapat audio maka tampilkan audio */}
      {question?.audio && (
        <div className="flex items-center p-3 border-b border-gray-200 font-nunito font-semibold text-lg">
          <div className="mr-auto py-1">
            <audio controls>
              <source src={question?.audio.url} type="audio/mpeg" />
              Your browser does not support the audio element.
            </audio>
          </div>
        </div>
      )}

      {/* pertanyaan */}
      <div
        className="px-4 py-3 font-roboto font-normal text-sm break-words"
        dangerouslySetInnerHTML={dangerHTML()}
      />

      <div className="border-b border-gray-100"></div>

      <div className="p-3">
        <QuestionOption
          data={question.choices}
          chosen={chosenAnswer}
          onChosen={handleChosen}
          isSaving={isSaving}
        />
      </div>

      {/* navigasi */}
      <div className="p-3 pb-5" key={question.id}>
        <div className="flex items-center justify-between">
          <button
            onClick={() => setQuestionIndex(questionIndex - 1)}
            className="p-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50"
            disabled={questionIndex == 0}
          >
            Soal sebelumnya
          </button>
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
          <button
            onClick={() => setQuestionIndex(questionIndex + 1)}
            className="px-3 py-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50"
            disabled={questions && questionIndex == questions.length - 1}
          >
            Soal berikutnya
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuestionSection;
