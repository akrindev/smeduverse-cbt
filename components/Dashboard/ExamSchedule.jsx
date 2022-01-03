import { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { api, useAuth } from '../../lib/hooks/auth'
import { ThreeDots } from '../Loading'

import useLocalStorage from '../../lib/hooks/useLocalStorage';

import { toDate } from '../../lib/todate';
import Modal from '../Dialog'
import ButtonKerjakan from '../ButtonKerjakan';
import DescriptionModalExam from '../DescriptionModalExam';

export default function ExamSchedule() {
  const [schedules, setSchedules] = useState([]);

  const { user } = useAuth({ middleware: 'auth' })

  useEffect(() => {
    const getExamSchedule = async () => {
      await api.get('/api/exam/schedule-list').then((res) => {
        setSchedules(res.data.ujian_schedule);
      }).catch(err => console.log(err))
    }

    getExamSchedule();
  }, [])
  

  return (
    <div className="col-span-12 bg-white shadow-lg rounded-sm border border-gray-200">
      <header className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Jadwal Ujian</h2>
      </header>

      {schedules && schedules.length > 0 ? (
        <ScheduleTable schedules={schedules} />
      ) : (
        <div className="px-5 py-4">
          <p className="text-gray-800">Belum ada jadwal ujian</p>
        </div>
      )}  
    </div>
  );
}

function ScheduleTable({ schedules }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState(null)

  const handleSelectSchedule = (schedule) => {
    setSelectedSchedule(schedule);
    setIsOpen(true);
  }

  return (
    <>
      <div className="p-1">

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="table-auto w-full">
            {/* Table header */}
            <thead className="text-xs uppercase text-gray-400 bg-gray-50 rounded-sm">
              <tr>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">Nama Ujian</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">J. Soal</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-left">KKM</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-center">Waktu</div>
                </th>
                <th className="p-2 whitespace-nowrap">
                  <div className="font-semibold text-center">Aksi</div>
                </th>
              </tr>
            </thead>
            {/* Table body */}
            <tbody className="text-xs font-medium divide-y divide-gray-100">
              {/* Row */}
              
        {schedules && schedules.map((schedule, index) => (
              <tr key={schedule.id}>
                <td className="p-2 whitespace-nowrap">
                  <div className="flex flex-col items-start">
                    <div className="text-gray-800 max-w-sm">{schedule.paket.name}</div>
                    <div className="text-gray-500 text-xs">{schedule.paket.mapel.nama} . {schedule.exam_plan.name}</div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="">{schedule.paket.soal_count}</div>
                </td>
                <td className="p-2">
                  <div className="">{schedule.paket.kkm}</div>
                </td>
                <td className="p-2 whitespace-nowrap text-gray-500">
                  <div className="text-center">{toDate(schedule.start_time)}</div>
                  <div className="text-center">{toDate(schedule.end_time)}</div>
                </td>
                <td className="p-2 whitespace-nowrap">
                  <ButtonKerjakan onClick={() => handleSelectSchedule(schedule)} schedule={schedule} />                  
                </td>
              </tr>))}
            </tbody>
          </table>

        </div>
      </div>
      <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Informasi Ujian" description={<DescriptionModalExam data={selectedSchedule} />} action={<ButtonExamPage token={selectedSchedule?.token} />}/>
    </>
  )
}

function ButtonExamPage({ token }) {
  const [isLoading, setIsLoading] = useState(false);
  const [examQuestions, setExamQuestions] = useLocalStorage('exam-questions', []);
  const [examSavedAnswers, setSavedAnswers] = useLocalStorage('exam-saved-answers', []);
  const [examInfo, setExamInfo] = useLocalStorage('exam-info', {});
  const router = useRouter();

  const onButtonClicked = async () => {
    // router.push('/exam')
    setIsLoading(true);
    
    api.get(`/api/exam/paket/${token}`).then(res => {
      // set exam to local storage
      setExamQuestions(prev => res.data.data.paket.soal);
      setSavedAnswers(prev => res.data.data.answer_sheets[0]?.saved_answer);

      setExamInfo({
        start_time: res.data.data.start_time,
        end_time: res.data.data.end_time,
        mapel: res.data.data.paket.mapel.nama,
        tingkat: res.data.data.paket.tingkat_kelas,
        sheet_id: res.data.data.answer_sheets[0]?.id,
        warn: res.data.data.answer_sheets[0]?.warn ?? 0,
      })
      // // ?then move to exam page
      router.push('/exam');
    }).catch(err => console.log(err)).finally(() => setIsLoading(false));
  }

  return (
    <button
      className="flex bg-green-500 px-5 py-1 rounded-lg text-white font-nunito border shadow disabled:opacity-50"
      onClick={onButtonClicked}
      disabled={isLoading}
      >
        {isLoading ? (<><ThreeDots/> <span className="ml-2">memuat soal</span> </>) : (<>Mulai</>)}
    </button>
  )
}