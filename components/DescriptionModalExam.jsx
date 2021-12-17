import { toDate } from '../lib/todate'

export default function DescriptionModalExam({ data }) {
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