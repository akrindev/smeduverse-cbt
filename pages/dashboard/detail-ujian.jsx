import Authenticated from "../../components/Layouts/Authenticated"

function Header() {
    return (
        <div className="flex flex-col text-white">
            <div className="font-poppins text-xl font-bold">
                Informasi ujian
            </div>
        </div>
    )
}

export default function DetailUjian() {
    return (
        <>
            <Authenticated header={<Header />}>
                <div className="relative my-3">
                    <div className="bg-white rounded-md shadow-md p-5">
                        <div className="flex flex-col">
                            <div className="text-base font-bold">
                                Jadwal Ujian
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">1 Desember 2021 07:30 - 09:00</div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <div className="text-base font-bold">
                                Mata Pelajaran
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">Algoritma Pemprograman</div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <div className="text-base font-bold">
                                Jurusan
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">Rekayasa Perangkat Lunak</div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <div className="text-base font-bold">
                                Judul Paket Soal
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">Algoritma Pemprograman Semester Genap</div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <div className="text-base font-bold">
                                Deskripsi Paket Soal
                            </div>
                            <div className="text-xs md:text-sm text-gray-600 break-words">
                                Lorem, ipsum dolor sit amet consectetur adipisicing elit. Perspiciatis aut accusamus ipsam, tempore commodi fugiat soluta eveniet, totam odio, reiciendis unde nulla! Molestiae dolore aspernatur quod cupiditate reprehenderit sint facilis.
                            </div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <div className="text-base font-bold">
                                Total Score 
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">
                                100
                            </div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <div className="text-base font-bold">
                                Jumlah Soal
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">
                                40
                            </div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <div className="text-base font-bold">
                                KKM 
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">
                                75
                            </div>
                        </div>
                        <div className="flex flex-col mt-3">
                            <div className="text-base font-bold">
                                Waktu 
                            </div>
                            <div className="text-xs md:text-sm text-gray-600">
                                60 menit
                            </div>
                        </div>
                        {/* button kerjakan */}
                        <div className="flex flex-col mt-8">
                            <button className="w-full py-3 rounded-md bg-green-600 text-white hover:bg-green-700 font-poppins font-semibold">
                                Mulai Kerjakan
                            </button>
                        </div>
                    </div>
                </div>
            </Authenticated>
        </>
    )
}