import { useRouter } from "next/router";
import { useEffect, useState } from "react";

import { ToastContainer, toast } from "react-toastify";

import { api } from "../../lib/hooks/auth";
import { ThreeDots } from "../Loading";

import { toDate } from "../../lib/todate";
import Modal from "../Dialog";
import ButtonKerjakan from "../ButtonKerjakan";
import ButtonExamPage from "./ButtonExamPage";
import DescriptionModalExam from "../DescriptionModalExam";

export default function ExamSchedule({ planId, onBack }) {
  const [schedules, setSchedules] = useState([]);
  const [isLoading, setIsloading] = useState("idle");

  useEffect(() => {
    const getExamSchedule = async () => {
      setIsloading("loading");

      await api
        .get(`/api/exam/schedule-list/${planId}`)
        .then((res) => {
          setSchedules(res.data?.ujian_schedule);
        })
        .catch((err) => {
          toast.error(err.response?.data?.message, {
            hideProgressBar: true,
            position: "top-left",
          });
        })
        .finally(() => setIsloading("idle"));
    };

    getExamSchedule();
  }, [planId]);

  return (
    <div className=''>
      <header className='flex flex-col px-5 py-4 border-b border-gray-100'>
        <div
          className='flex items-center space-x-2 cursor-pointer hover:opacity-40'
          onClick={onBack}>
          <svg
            className='w-4 h-4'
            fill='none'
            stroke='currentColor'
            viewBox='0 0 24 24'
            xmlns='http://www.w3.org/2000/svg'>
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M7 16l-4-4m0 0l4-4m-4 4h18'
            />
          </svg>
          <span>kembali</span>
        </div>
        <h1 className='text-xl font-semibold text-gray-800'>Jadwal Ujian</h1>
      </header>

      {schedules && schedules.length > 0 ? (
        <ScheduleCard schedules={schedules} />
      ) : (
        <div className='px-5 py-4'>
          {isLoading ? (
            <ThreeDots />
          ) : (
            <p className='text-gray-800'>Belum ada jadwal ujian</p>
          )}
        </div>
      )}
      <ToastContainer />
    </div>
  );
}

function ScheduleCard({ schedules }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null);

  const handleSelectSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setIsOpen(true);
  };

  return (
    <>
      <div
        className={`
        grid grid-cols-12 gap-3 px-3
      `}>
        {schedules &&
          schedules.map((schedule, index) => (
            <div
              key={schedule.id}
              className='col-span-12 md:col-span-6 xl:col-span-4'>
              <div
                className={`
              flex flex-col items-start
               p-3 md:p-5
               border border-transparent
              ${
                new Date(schedule.end_time) < new Date()
                  ? `bg-slate-50/90 bg-opacity-95 cursor-not-allowed rounded-t`
                  : `bg-white
                  hover:bg-green-100/95
                  rounded-t`
              }
            `}>
                <div className={`font-semibold`}>{schedule.paket.name}</div>
                <div className={`text-sm text-gray-600`}>
                  {schedule.paket.mapel.nama} . {schedule.exam_plan.name}
                </div>
                <div
                  className={`flex items-center space-x-2 text-sm text-gray-600`}>
                  <div className='flex items-center space-x-2'>
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      xmlns='http://www.w3.org/2000/svg'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                    <span>{schedule.paket.soal_count} soal</span>
                  </div>
                  <div className='flex items-center space-x-2'>
                    <svg
                      className='w-4 h-4'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      xmlns='http://www.w3.org/2000/svg'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z'
                      />
                    </svg>
                    <span>{schedule.paket.kkm} KKM</span>
                  </div>
                </div>
                <div className='flex items-center space-x-2 text-xs text-gray-600'>
                  <div className='flex items-center space-x-1'>
                    <svg
                      className='w-3 h-3'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      xmlns='http://www.w3.org/2000/svg'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                    <span>{toDate(schedule.start_time)}</span>
                    <svg
                      className='w-3 h-3'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                      xmlns='http://www.w3.org/2000/svg'>
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636'
                      />
                    </svg>
                    <span>{toDate(schedule.end_time)}</span>
                  </div>
                </div>
              </div>
              <ButtonKerjakan
                onClick={() => handleSelectSchedule(schedule)}
                schedule={schedule}
              />
            </div>
          ))}
      </div>
      <Modal
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        title='Informasi Ujian'
        description={<DescriptionModalExam data={selectedSchedule} />}
        action={<ButtonExamPage token={selectedSchedule?.token} />}
      />
    </>
  );
}
