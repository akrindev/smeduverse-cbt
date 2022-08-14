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
import QuestionComponent from "../../components/Exam/QuestionComponent";

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
  }, [questions, savedAnswers]);

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
    if (typeof global.window !== "undefined" && examInfo.warnEnabled) {
      global.window.addEventListener("blur", handleWarn);
    }

    return () => {
      if (typeof global.window !== "undefined" && examInfo.warnEnabled) {
        global.window.removeEventListener("blur", handleWarn);
      }
    };
  }, [handleWarn, examInfo]);

  return (
    <>
      <Head>
        <title>Mengerjakan Ujian</title>
      </Head>
      <ExamBegin header={<NavHead examInfo={examInfo} />}>
        <QuestionComponent />
      </ExamBegin>
      <ToastContainer />
    </>
  );
}
