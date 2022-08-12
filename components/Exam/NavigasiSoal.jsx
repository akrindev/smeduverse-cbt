import { useState } from "react";
import NavButirSoal from "./NavButirSoal";
import useLocalStorage from "../../lib/hooks/useLocalStorage";
import find from "lodash/find";
import { useExamQuestions } from "../../store/useExamQuestions";
import { useSavedAnswers } from "../../store/useSavedAnswers";
import { useExamInfo } from "../../store/useExamInfo";

const NavigasiSoal = ({ onStopExam }) => {
  const questions = useExamQuestions((state) => state.questions);
  const savedAnswers = useSavedAnswers((state) => state.savedAnswers);
  const examInfo = useExamInfo((state) => state.examInfo);

  const isChosen = (chosenId) => {
    const chosen = find(savedAnswers, (item) => item.exam_soal_id === chosenId);

    return chosen.answer_chosen_id != null;
  };

  const isRagu = (chosenId) => {
    return (
      find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu == 1
    );
  };

  return (
    <div className='col-span-12 lg:col-span-4'>
      <div className='p-4 bg-white rounded shadow'>
        <div className='font-bold text-base mb-5'>Navigasi Soal</div>
        <div className='grid grid-cols-10 gap-2 w-full mx-auto'>
          {questions &&
            questions.map((question, index) => (
              <NavButirSoal
                isChosen={isChosen(question.id)}
                isRagu={isRagu(question.id)}
                // onClick={setQuestionIndex(index)}
                key={question.id}
                number={index + 1}
              />
            ))}
        </div>
        <div className='mt-5 flex justify-end'>
          <button
            className='bg-gray-200 text-sm px-4 py-1 rounded-lg border border-gray-500 font-medium'
            onClick={onStopExam}>
            Hentikan Ujian
          </button>
        </div>
        <div className='mt-3'>
          <div className='flex flex-col items-start'>
            <div className='flex items-center space-x-3'>
              <div className='h-2 w-2 bg-green-500 rounded'></div>{" "}
              <span className='text-xs text-gray-600'>soal telah dijawab</span>
            </div>
            <div className='flex items-center space-x-3 mt-1'>
              <div className='h-2 w-2 bg-yellow-500 rounded'></div>{" "}
              <span className='text-xs text-gray-600'>ragu-ragu</span>
            </div>
            <div className='flex items-center space-x-3 mt-1'>
              <div className='h-2 w-2 bg-gray-700 rounded'></div>{" "}
              <span className='text-xs text-gray-600'>belum dijawab</span>
            </div>
            <div className='flex items-center mt-5 text-xs font-medium'>
              <div className='text-red-600 mr-1'>Peringatan</div>{" "}
              <span className='text-xs text-red-900 font-bold'>
                {" "}
                {examInfo && examInfo.warn}{" "}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavigasiSoal;
