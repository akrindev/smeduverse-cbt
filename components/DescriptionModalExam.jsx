import { toDate } from '../lib/todate'

export default function DescriptionModalExam({ data }) {
  if (!data?.paket) {
    return null;
  }

  return (
    <>
      <div className="flex flex-col font-nunito">
        <div>
          <div className="font-bold text-base text-black">Nama Paket</div>
          <div className="font-normal text-gray-800">({data.paket.kode}) {data.paket.name}</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">Deskripsi Paket</div>
          <div className="font-normal text-gray-800">{data.paket.description}</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">Mapel</div>
          <div className="font-normal text-gray-800">{data.paket.mapel.nama}</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">Tingkat Kelas</div>
          <div className="font-normal text-gray-800">{data.paket.tingkat_kelas}</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">Jurusan</div>
          <div className="font-normal text-gray-800">{data.paket.jurusan.nama}</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">Jumlah Soal</div>
          <div className="font-normal text-gray-800">{data.paket.soal_count}</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">KKM</div>
          <div className="font-normal text-gray-800">{data.paket.kkm}</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">Waktu</div>
          <div className="font-normal text-gray-800">{data.paket.waktu} menit</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">Mulai</div>
          <div className="font-normal text-gray-800">{toDate(data.start_time)}</div>
        </div>
        <div className="mt-2">
          <div className="font-bold text-base text-black">Selesai</div>
          <div className="font-normal text-gray-800">{toDate(data.end_time)}</div>
        </div>
      </div>
    </>
  )
}
