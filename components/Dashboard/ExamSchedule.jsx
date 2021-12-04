import { useRouter } from 'next/router'

export default function ExamSchedule() {
  const router = useRouter();

  return (
    <div className="col-span-12 bg-white shadow-lg rounded-sm border border-gray-200">
      <header className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-semibold text-gray-800">Jadwal Ujian</h2>
      </header>
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
              <tr>
                <td className="p-2 whitespace-nowrap">
                  <div className="flex flex-col items-start">
                    <div className="text-gray-800">Pendidikan Agama Islam</div>
                    <div className="text-gray-500 text-xs">Ujian Akhir Semester</div>
                  </div>
                </td>
                <td className="p-2">
                  <div className="">40</div>
                </td>
                <td className="p-2">
                  <div className="">75</div>
                </td>
                <td className="p-2 whitespace-nowrap text-gray-500">
                  <div className="text-center">22 Des 2021 07:30</div>
                  <div className="text-center">22 Des 2021 10:30</div>
                </td>
                <td className="p-2">
                  <div className="text-center">
                      <button className="bg-green-500 rounded-md px-3 py-1 text-white shadow"
                        onClick={() => router.push('/dashboard/detail-ujian')}
                      >
                          kerjakan
                        </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>

        </div>
      </div>
    </div>
  );
}