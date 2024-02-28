import { useState, useEffect, useCallback } from "react";
import { ThreeDots } from "../Loading";
import QuestionOption from "../QuestionOption";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { api } from "../../lib/hooks/auth";
import find from "lodash/find";
import debounce from "lodash/debounce";

import { toast } from "react-toastify";

const QuestionSection = () => {
  const [question, setQuestion] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [chosenAnswer, setChosenAnswer] = useState(null);
  const [initiating, setInitiating] = useState(true);
  const [contentAnswer, setContentAnswer] = useState("");

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

  const handleContentAnswer = useCallback(
    (value) => {
      setIsSaving(true);

      // update saved answers
      const answer = find(
        savedAnswers,
        (item) => item.exam_soal_id === question.id
      );
      answer.content = value;

      try {
        api
          .patch("/api/exam/save-answer", {
            exam_answer_sheet_id: answer.exam_answer_sheet_id,
            exam_soal_id: answer.exam_soal_id,
            content: value,
          })
          .then((res) => {
            if (res.status === 200) {
              updateChosenAnswer(answer);
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
    },
    [savedAnswers, question, updateChosenAnswer]
  );

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
      find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu === 1,
    [savedAnswers]
  );

  const dangerHTML = () => {
    return {
      __html: question?.question ?? "",
    };
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    // set initiating to false
    setInitiating(false);

    const getChosenAnswer = () => {
      const chosen = find(savedAnswers, { exam_soal_id: question?.id });

      if (chosen) {
        setChosenAnswer(chosen);
        setContentAnswer((prev) => chosen?.content || "");
      }
    };

    if (questions && questions.length > 0) {
      setQuestion(questions[questionIndex]);
      getChosenAnswer();
    }

    return () => {
      setInitiating(true);
    };
  }, [questionIndex, question, questions, savedAnswers]);

  // use effect to listen to content answer
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (contentAnswer) {
        handleContentAnswer(contentAnswer);
      }
    }, 1000);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentAnswer]);

  return (
    <div className="bg-white rounded shadow">
      {/* header info */}
      <div className="flex items-center p-3 border-b border-gray-200 font-nunito font-semibold text-lg">
        {!initiating && (
          <div className="mr-auto py-1">
            Soal {questionIndex + 1 || 0} / {questions.length || 0}
          </div>
        )}
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
            {/* biome-ignore lint/a11y/useMediaCaption: <explanation> */}
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
        // biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
        dangerouslySetInnerHTML={dangerHTML()}
      />

      <div className="border-b border-gray-100" />

      <div className="p-3">
        {question?.type === 1 && (
          <QuestionOption
            data={question.choices}
            chosen={chosenAnswer}
            onChosen={handleChosen}
            isSaving={isSaving}
          />
        )}

        {question?.type === 2 && (
          <div>
            {/* styling teaxtare */}
            <textarea
              className={`w-full h-40 p-3 rounded-lg border ${
                isSaving ? "border-green-200" : "border-sky-400"
              }`}
              placeholder="Tulis jawabanmu disini"
              value={contentAnswer}
              onChange={(e) => {
                setContentAnswer(e.target.value);
                // handleContentAnswer(e.target.value);
              }}
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
