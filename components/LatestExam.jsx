import { useRouter } from "next/router"

export default function LatestExam() {
    const router = useRouter();

    const data = [
        {
            mapel: 'Ujian Akhir Semester',
            paket: '12 jadwal',
            tanggal: '29 Nov 2021 07:45'
        },
        {
            mapel: 'Ujian Tengah Semester',
            paket: '12 jadwal',
            tanggal: '29 Jun 2021 10:45'
        },
    ]

    return (
        <>
            {data && data.map((item) => {
                return (<div key={data.tanggal} className="bg-white shadow-lg rounded-md mt-5 px-3 py-2 hover:bg-lightBlue-700 hover:text-white duration-200">
                    <div className="flex" onClick={() => router.push(`/exam`)}>
                        <div className="flex flex-col">
                            <div className="font-nunito text-md font-bold">{item.mapel}</div>
                            <div className="text-sm font-light">{item.paket}</div>
                        </div>
                        <div className="flex flex-col ml-auto text-right">
                            {/* <div className="font-nunito text-md font-bold">80</div> */}
                            <div className="text-sm font-light">{item.tanggal}</div>
                        </div>
                    </div>
                </div>)
            })}
        </>
    )
}