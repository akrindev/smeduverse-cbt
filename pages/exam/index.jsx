import Head from "next/head";
import Image from "next/image";
import { useEffect, useState, useCallback, useReducer } from "react";
import { ToastContainer, toast } from "react-toastify";
import find from "lodash/find";
import filter from "lodash/filter";

import { api } from "../../lib/hooks/auth";
import { getResult } from "../../lib/services/getResult";
import { loaderImg } from "../../lib/loaderImg";
import { ThreeDots } from "../../components/Loading";

import useLocalStorage from "../../lib/hooks/useLocalStorage";

import ExamBegin from "../../components/Layouts/ExamBegin";
import QuestionOption from "../../components/QuestionOption";
import NavButirSoal from "../../components/Exam/NavButirSoal";
import NavHead from "../../components/Exam/NavHead";
import Modal from "../../components/Dialog";
import NavigasiSoal from "../../components/Exam/NavigasiSoal";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useExamInfo } from "../../store/useExamInfo";

export default function ExamIndex() {
  const [question, setQuestion] = useState({});
  const [chosenAnswer, setChosenAnswer] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const examInfo = useExamInfo((state) => state.examInfo);
  const setExamInfo = useExamInfo((state) => state.setExamInfo);
  const setWarn = useExamInfo((state) => state.setWarn);
  const questions = useExamQuestions((state) => state.questions);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);
  const setSavedAnswers = useSavedAnswers((state) => state.setSavedAnswers);
  const updateChosenAnswer = useSavedAnswers(
    (state) => state.updateChosenAnswer
  );

  // dialog state
  const [isOpenDialog, setIsOpenDialog] = useState(false);

  if (!questions && !savedAnswers) {
    if (typeof window !== "undefined") {
      window.location.href = "/dashboard";
    }
  }

  const stopExam = () => {
    setIsOpenDialog(true);
  };

  const handleChosen = async (value) => {
    setIsSaving(true);
    // update saved answers
    const answer = savedAnswers.find(
      (item) => item.exam_soal_id === question.id
    );

    try {
      await api
        .patch("/api/exam/save-answer", {
          exam_answer_sheet_id: answer.exam_answer_sheet_id,
          exam_soal_id: answer.exam_soal_id,
          answer_chosen_id: value,
        })
        .then((res) => {
          if (res.status === 200) updateChosenAnswer(question.id, value);
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

    await api
      .patch("/api/exam/ragu-answer", {
        exam_answer_sheet_id: answer.exam_answer_sheet_id,
        exam_soal_id: answer.exam_soal_id,
        ragu: answer.ragu === 1 ? 0 : 1,
      })
      .then((res) => {
        if (res.status === 200) {
          const newSavedAnswers = find(
            savedAnswers,
            (item) => item.exam_soal_id === question.id
          );

          newSavedAnswers.ragu = answer.ragu === 1 ? 0 : 1;
          setSavedAnswers(savedAnswers);
        }
      })
      .catch((err) => console.log(err))
      .finally(() => {
        setIsSaving(false);
      });
  };

  const isChosen = (chosenId) => {
    const chosen = find(savedAnswers, (item) => item.exam_soal_id === chosenId);

    return chosen.answer_chosen_id != null;
  };

  const isRagu = (chosenId) => {
    return (
      find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu == 1
    );
  };

  const onTimeEnd = () => {
    getResult(savedAnswers && savedAnswers[0]?.exam_answer_sheet_id).then(
      (res) => {
        toast.success("ujian di selesaikan");
      }
    );
  };

  const handleWarn = useCallback(
    async (event) => {
      await api
        .patch("/api/exam/warn-exam", {
          sheet_id: examInfo.sheet_id,
        })
        .then((res) => {
          setWarn({
            warn: res.data?.warn || 0,
          });
        })
        .catch((err) => console.error(err));

      toast.error("Kamu meninggalkan halaman ujian, peringatan ditambahkan");
      const sound = new Audio("/assets/sounds/goes.ogg");
      sound.play();
    },
    [examInfo, setWarn]
  );

  // prevent leave window
  useEffect(() => {
    if (typeof global.window !== "undefined") {
      global.window.addEventListener("blur", handleWarn);
    }

    return () => {
      if (typeof global.window !== "undefined") {
        global.window.removeEventListener("blur", handleWarn);
      }
    };
  }, [handleWarn]);

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

  const dangerHTML = () => {
    return {
      __html: question?.question ?? "",
    };
  };

  return (
    <>
      <Head>
        <title>Mengerjakan Ujian</title>
      </Head>
      <ExamBegin header={<NavHead examInfo={examInfo} onTimeEnd={onTimeEnd} />}>
        <div className='relative my-3 w-full max-w-7xl mx-auto'>
          <div className='grid grid-cols-12 gap-6 w-full mx-auto'>
            <div className='col-span-12 lg:col-span-8'>
              <div className='bg-white rounded shadow'>
                {/* header info */}
                <div className='flex items-center p-3 border-b border-gray-200 font-nunito font-semibold text-lg'>
                  <div className='mr-auto py-1'>
                    Soal {questionIndex + 1} / {questions && questions.length}
                  </div>
                  <div>
                    {isSaving && (
                      <div className='text-xs rounded-lg text-green-800 bg-green-100 flex items-center justify-center space-x-2 py-1 px-3'>
                        <ThreeDots /> <span>menyimpan jawaban</span>
                      </div>
                    )}
                  </div>
                </div>
                {/* jika terdapat audio maka tampilkan audio */}
                {question?.audio && (
                  <div className='flex items-center p-3 border-b border-gray-200 font-nunito font-semibold text-lg'>
                    <div className='mr-auto py-1'>
                      <audio controls>
                        <source src={question?.audio.url} type='audio/mpeg' />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  </div>
                )}
                {/* pertanyaan */}
                <div
                  className='px-4 py-3 font-roboto font-normal text-sm break-words'
                  dangerouslySetInnerHTML={dangerHTML()}
                />

                <div className='border-b border-gray-100'></div>

                <div className='p-3'>
                  <QuestionOption
                    data={question.choices}
                    chosen={chosenAnswer}
                    onChosen={handleChosen}
                    isSaving={isSaving}
                  />
                </div>

                <div className='p-3 pb-5' key={question.id}>
                  <div className='flex items-center justify-between'>
                    <button
                      onClick={() => setQuestionIndex((prev) => prev - 1)}
                      className='p-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50'
                      disabled={questionIndex == 0}>
                      Soal sebelumnya
                    </button>
                    <button
                      className={`px-3 py-2 ${
                        questions && isRagu(question.id)
                          ? "bg-yellow-500 text-gray-100"
                          : "bg-white text-yellow-500"
                      } border border-yellow-600  text-xs rounded-md`}
                      onClick={handleRagu}>
                      Ragu-ragu
                    </button>
                    <button
                      onClick={() => setQuestionIndex((prev) => prev + 1)}
                      className='px-3 py-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50'
                      disabled={
                        questions && questionIndex == questions.length - 1
                      }>
                      Soal berikutnya
                    </button>
                  </div>
                </div>
              </div>
            </div>
            {/* navigasi soal */}
            <NavigasiSoal onStopExam={stopExam} />
          </div>
          <div className='flex items-center justify-center text-center mt-14 text-warmGray-500'>
            <strong>Smeducative</strong>
            <span className='ml-1 text-sm font-light'>
              is part of SMK Diponegoro Karanganyar
            </span>
          </div>
        </div>
        <ToastContainer />
      </ExamBegin>
      <Modal
        isOpen={isOpenDialog}
        setIsOpen={setIsOpenDialog}
        title={`Yakin udah selesai?`}
        description={<ChosenAnswer answers={savedAnswers} />}
        action={
          <ButtonResult
            sheetId={savedAnswers && savedAnswers[0]?.exam_answer_sheet_id}
          />
        }
      />
    </>
  );
}

function ButtonResult({ sheetId }) {
  const [isLoading, setIsLoading] = useState(false);
  const [savedAnswers, setSavedAnswers] = useLocalStorage("exam-saved-answers");

  const handleClick = async () => {
    setIsLoading(true);
    await getResult(
      savedAnswers && savedAnswers[0]?.exam_answer_sheet_id
    ).finally(() => setIsLoading(false));
  };

  return (
    <>
      <button
        className={`bg-green-500 text-white rounded-md px-4 py-1 disabled:opacity-60`}
        disabled={isLoading}
        onClick={handleClick}>
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
        <div className='flex items-center justify-center mb-5'>
          <Image
            loader={loaderImg}
            src={`/assets/images/yay.png`}
            width={160}
            height={160}
            unoptimized
          />
        </div>
        <span>Pastikan untuk mengoreksi sebelum menyelesaikan ujian 🎉</span>
        <div className='divide-black my-5'></div>
        <div className='flex items-center space-x-3 w-full'>
          <div className='flex flex-col items-center w-full'>
            <strong>Dijawab</strong>
            <span>{chosenAnswer}</span>
          </div>
          <div className='flex flex-col items-center w-full'>
            <strong>Kosong</strong>
            <span>{emptyAnswer}</span>
          </div>
          <div className='flex flex-col items-center w-full'>
            <strong>Total</strong>
            <span>{answers.length}</span>
          </div>
        </div>
        <div className='divide-black my-5'></div>
      </div>
    </>
  );
}
