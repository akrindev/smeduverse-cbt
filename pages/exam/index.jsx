import Head from "next/head";

import { useEffect, useCallback } from "react";
import { ToastContainer, toast } from "react-toastify";

import { api } from "../../lib/hooks/auth";
import { getResult } from "../../lib/services/getResult";
import ExamBegin from "../../components/Layouts/ExamBegin";
import NavHead from "../../components/Exam/NavHead";
import NavigasiSoal from "../../components/Exam/NavigasiSoal";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useExamInfo } from "../../store/useExamInfo";
import QuestionSection from "../../components/Exam/QuestionSection";

export default function ExamIndex() {
  const questions = useExamQuestions((state) => state.questions);
  const examInfo = useExamInfo((state) => state.examInfo);
  const setWarn = useExamInfo((state) => state.setWarn);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);

  useEffect(() => {
    if (questions.length <= 0 && savedAnswers.length <= 0) {
      if (typeof window !== "undefined") {
        // console.log("test", questions, savedAnswers);
        window.location.href = "/dashboard";
      }
    }
  });

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

  return (
    <>
      <Head>
        <title>Mengerjakan Ujian</title>
      </Head>
      <ExamBegin header={<NavHead examInfo={examInfo} onTimeEnd={onTimeEnd} />}>
        <div className='relative my-3 w-full max-w-7xl mx-auto'>
          <div className='grid grid-cols-12 gap-6 w-full mx-auto'>
            <div className='col-span-12 lg:col-span-8'>
              {questions.length > 0 && <QuestionSection />}
            </div>
            {/* navigasi soal */}
            {questions.length > 0 && <NavigasiSoal />}
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
    </>
  );
}
