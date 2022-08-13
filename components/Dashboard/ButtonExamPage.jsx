import { useState } from "react";
import { useRouter } from "next/router";
import { toast } from "react-toastify";

import { api } from "../../lib/hooks/auth";
import { ThreeDots } from "../Loading";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useExamInfo } from "../../store/useExamInfo";

export default function ButtonExamPage({ token }) {
  const [isLoading, setIsLoading] = useState(false);

  const setQuestions = useExamQuestions((state) => state.setQuestions);
  const setSavedAnswers = useSavedAnswers((state) => state.setSavedAnswers);
  const { setExamInfo } = useExamInfo();

  const router = useRouter();

  const onButtonClicked = async () => {
    // router.push('/exam')
    setIsLoading(true);

    api
      .post(`/api/exam/paket/${token}`)
      .then((res) => {
        // set exam to local storage
        setQuestions(res.data.data.paket.soal);

        setSavedAnswers(res.data.data.answer_sheets[0].saved_answer);

        setExamInfo({
          start_time: res.data.data.start_time,
          end_time: res.data.data.end_time,
          mapel: res.data.data.paket.mapel.nama,
          tingkat: res.data.data.paket.tingkat_kelas,
          sheet_id: res.data.data.answer_sheets[0]?.id,
          warn: res.data.data.answer_sheets[0]?.warn || 0,
        });
        // // ?then move to exam page
        router.push("/exam");
      })
      .catch((err) => {
        console.log(err.response?.data?.message);
        toast.error(err.response?.data?.message, {
          hideProgressBar: true,
          position: "top-left",
        });
      })
      .finally(() => setIsLoading(false));
  };

  return (
    <button
      className='flex bg-green-500 px-5 py-1 rounded-lg text-white font-nunito border shadow disabled:opacity-50'
      onClick={onButtonClicked}
      disabled={isLoading}>
      {isLoading ? (
        <>
          <ThreeDots /> <span className='ml-2'>memuat soal</span>{" "}
        </>
      ) : (
        <>Mulai</>
      )}
    </button>
  );
}
