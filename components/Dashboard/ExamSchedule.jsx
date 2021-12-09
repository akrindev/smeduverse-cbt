import router, { useRouter } from 'next/router'
import { useEffect, useState } from 'react';
import { api } from '../../lib/hooks/auth'
import { ThreeDots } from '../Loading'

import Modal from '../Dialog'

const toDate = (day) => {
  const date = new Date(day).toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
  });

  return date
}

export default function ExamSchedule() {
  const [schedules, setSchedules] = useState([]);

  useEffect(() => {
    const getExamSchedule = async () => {
      const { data } = await api.get('/api/exam/schedule-list');

      setSchedules(data.ujian_schedule);
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

  const router = useRouter();

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
                <td className="p-2">
                  <div className="text-center">
                      <button className="bg-green-500 rounded-md px-3 py-1 text-white shadow"
                        onClick={() => handleSelectSchedule(schedule)}
                      >
                          kerjakan
                        </button>
                  </div>
                </td>
              </tr>))}
            </tbody>
          </table>

        </div>
      </div>
      <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Informasi Ujian" description={<DescriptionModal data={selectedSchedule} />} action={<ButtonExamPage/>}/>
    </>
  )
}

function DescriptionModal({ data }) {
  console.log(data)
  return (
    <>
      <div className="flex flex-col font-nunito">
        <div>
          <div className="font-bold text-base">Nama Paket</div>
          <div className="font-normal text-gray-800">({data.paket.kode}) {data.paket.name}</div>
        </div>
        <div className="mt-3">
          <div className="font-bold text-base">Deskripsi Paket</div>
          <div className="font-normal text-gray-800">{data.paket.description}</div>
        </div>
        <div className="mt-3">
          <div className="font-bold text-base">Mapel</div>
          <div className="font-normal text-gray-800">{data.paket.mapel.nama}</div>
        </div>
        <div className="mt-3">
          <div className="font-bold text-base">Tingkat Kelas</div>
          <div className="font-normal text-gray-800">{data.paket.tingkat_kelas}</div>
        </div>
        <div className="mt-3">
          <div className="font-bold text-base">KKM</div>
          <div className="font-normal text-gray-800">{data.paket.kkm}</div>
        </div>
        <div className="mt-3">
          <div className="font-bold text-base">Waktu</div>
          <div className="font-normal text-gray-800">{data.paket.waktu} menit</div>
        </div>
        <div className="mt-3">
          <div className="font-bold text-base">Pada</div>
          <div className="font-normal text-gray-800">{toDate(data.start_time)}</div>
        </div>
        <div className="mt-3">
          <div className="font-bold text-base">Sampai</div>
          <div className="font-normal text-gray-800">{toDate(data.end_time)}</div>
        </div>
      </div>
    </>
  )
}

function ButtonExamPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const onButtonClicked = () => {
    // router.push('/exam')
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
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