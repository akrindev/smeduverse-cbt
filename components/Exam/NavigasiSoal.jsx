import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import NavButirSoal from "./NavButirSoal";
import find from "lodash/find";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useExamInfo } from "../../store/useExamInfo";
import Modal from "../Dialog";

import { getResult } from "../../lib/services/getResult";
import { loaderImg } from "../../lib/loaderImg";
import filter from "lodash/filter";
import { useExamTime } from "../../store/useExamTime";

const NavigasiSoal = () => {
  const questions = useExamQuestions((state) => state.questions);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);
  const examInfo = useExamInfo((state) => state.examInfo);
  const setQuestionIndex = useExamQuestions((state) => state.setQuestionIndex);
  const [isOpenDialog, setIsOpenDialog] = useState(false);
  // state for initiate
  const [initiating, setInitiating] = useState(true);

  const [canSubmit, setCanSubmit] = useState(false);

  const { submitable } = useExamTime((state) => state.submitable);

  const stopExam = () => {
    if (canSubmit && !submitable) {
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

      return chosen.answer_chosen_id != null;
    },
    [savedAnswers]
  );

  const isRagu = useCallback(
    (chosenId) => {
      return (
        find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu == 1
      );
    },
    [savedAnswers]
  );

  // use effect for initiate
  useEffect(() => {
    if (questions && questions.length > 0) {
      setInitiating(false);
    }

    let time = setTimeout(() => {
      setCanSubmit(submitable ? true : false);
    }, 2000);

    return () => clearTimeout(time);
  }, [questions, submitable]);

  return (
    !initiating && (
      <>
        <div className='col-span-12 lg:col-span-4'>
          <div className='p-4 bg-white rounded shadow'>
            <div className='font-bold text-base mb-5'>Navigasi Soal</div>
            <div className='grid grid-cols-10 gap-2 w-full mx-auto'>
              {questions &&
                questions.map((question, index) => (
                  <NavButirSoal
                    key={question.id}
                    isChosen={isChosen(question.id)}
                    isRagu={isRagu(question.id)}
                    onClick={() => setQuestionIndex(index)}
                    number={index + 1}
                  />
                ))}
            </div>
            <div className='mt-5 flex justify-end'>
              {canSubmit ? (
                <button
                  className='bg-gray-200 text-sm px-4 py-1 rounded-lg border border-gray-500 font-medium'
                  onClick={stopExam}>
                  Hentikan Ujian
                </button>
              ) : (
                <span className='text-gray-400 text-xs'>
                  ujian dapat dikumpulkan 15 menit sebelum ujian berakhir
                </span>
              )}
            </div>
            <div className='mt-3'>
              <div className='flex flex-col items-start'>
                <div className='flex items-center space-x-3'>
                  <div className='h-2 w-2 bg-green-500 rounded'></div>
                  <span className='text-xs text-gray-600'>
                    soal telah dijawab
                  </span>
                </div>
                <div className='flex items-center space-x-3 mt-1'>
                  <div className='h-2 w-2 bg-yellow-500 rounded'></div>
                  <span className='text-xs text-gray-600'>ragu-ragu</span>
                </div>
                <div className='flex items-center space-x-3 mt-1'>
                  <div className='h-2 w-2 bg-gray-700 rounded'></div>
                  <span className='text-xs text-gray-600'>belum dijawab</span>
                </div>

                {examInfo.warnEnabled && (
                  <div className='flex items-center mt-5 text-xs font-medium'>
                    <div className='text-red-600 mr-1'>Peringatan</div>
                    <span className='text-xs text-red-900 font-bold'>
                      {examInfo && examInfo.warn}
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
          title={`Yakin udah selesai?`}
          description={<ChosenAnswer answers={savedAnswers} />}
          action={
            savedAnswers && (
              <ButtonResult sheetId={savedAnswers[0]?.exam_answer_sheet_id} />
            )
          }
        />
      </>
    )
  );
};

function ButtonResult({ sheetId }) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    setIsLoading(true);

    await getResult(sheetId).finally(() => setIsLoading(false));
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
            alt='yay'
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

export default NavigasiSoal;
