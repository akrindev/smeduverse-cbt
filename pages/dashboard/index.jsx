import Authenticated from "../../components/Layouts/Authenticated"
import BaseProfile from "../../components/BaseProfile"
import LatestExam from "../../components/LatestExam"

function Header() {
    return (
        <div className="flex flex-col text-white">
            <div className="font-poppins text-xl font-bold">
                Hello, Syakirin Amin
            </div>
            <div className="font-nunito text-lg font-normal">XI RPL</div>
        </div>
    )
}

export default function Index() {
    const data = {
        nis: 220899,
        nisn: 882288999,
        ttl: 'Pekalongan, 22 Agustus 1999',
        umur: 22
    }

    return (
        <Authenticated header={<Header/>}>
            <BaseProfile data={data}/>

            <div className="my-8">
                {/* kode ujian */}
                <div className="block p-5 bg-white shadow-md rounded-md mb-5">
                    <label className="text-lg font-bold">Kode Ujian</label>
                    <div className="flex">
                        <input type="text"
                            className="px-3 py-3 placeholder-blueGray-300 text-blueGray-900 bg-blueGray-100 rounded text-sm shadow-lg focus:bg-blue-50 w-full"
                            placeholder="Kode Ujian"
                        />
                        <button className="ml-3 bg-lightBlue-700 text-white font-bold rounded px-5 hover:bg-lightBlue-900">Periksa</button>
                    </div>
                </div>
            </div>


            <div className="text-xl font-bold">Ujian terakhir</div>

            <LatestExam />
        </Authenticated>
    )
}

