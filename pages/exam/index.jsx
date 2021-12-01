import ExamBegin from "../../components/Layouts/ExamBegin"
import QuestionOption from "../../components/QuestionOption"

function NavHead() {
    return (
        <>
            <div className="flex justify-between hover:cursor-pointer max-w-7xl mx-auto">
                <div className="text-lg font-bold text-white">
                    Computer Based Test
                </div>
                <div className="rounded-xl text-sm shadow-2xl px-4 py-1 bg-white">30:44 menit</div>
            </div>
        </>
    )
}

export default function ExamIndex() {

    const dangerHTML = () => {
        return {
            __html: 'lorem ipsum dolor sit amet <b>aku akan di tebali dengan ke imanan </b> dan ketangguhan jiwa <i>hehe</i> dan aku  akan bisa ke mana sih anjir aku aja ngga tau mau kemana tapi aku tidak akan tau kemana sih yang akan kamu lakukan jika itu yang terjadi. aku hanya ingin mencoba untuk tidak menggunakan ini lagi tapi aku ngga tau apa yang akan kamu lakukan jika itu yang terbaik unttuk aku terima, aku berterimakasih kepadamu arena aku yang disini bisa jadi seperti apa yang aku minta, kamu tau aku ngga tau apa apa <img src="http://placekitten.com/200/200" alt=""/> nah disini ada kucing yang akan menemani mu sampai aku tidak tau lagi mau ngomong apa soalnya ini cuma tulisan saja'
        }
    }

    return (
        <>
            <ExamBegin header={<NavHead/>}>
                <div className="relative my-3 w-full max-w-7xl mx-auto">
                    <div className="grid grid-cols-12 gap-6 w-full mx-auto">
                        <div className="col-span-12 lg:col-span-8">
                            <div className="bg-white rounded shadow">
                                {/* header info */}
                                <div className="px-5 py-3 border-b border-gray-200 font-nunito font-semibold text-xl">
                                    Soal ke 1
                                </div>
                                {/* pertanyaan */}  
                                <div className="px-4 py-3 font-nunito font-normal text-base" dangerouslySetInnerHTML={dangerHTML()} />

                                <div className="border-b border-gray-100"></div>

                                <div className="p-3">
                                    <QuestionOption />
                                </div>

                                <div className="p-3 pb-5">
                                    <div className="flex items-center justify-between">
                                        <button className="px-3 py-2 bg-gray-100 border border-gray-400 text-sm rounded-md">
                                            Soal Sebelumnya
                                        </button>
                                        <button className="px-3 py-2 bg-yellow-500 border border-yellow-600 text-gray-100 text-sm rounded-md">
                                            Ragu-ragu
                                        </button>
                                        <button className="px-3 py-2 bg-gray-100 border border-gray-400 text-sm rounded-md">
                                            Soal Berikutnya
                                        </button>
                                    </div>
                                </div>

                            </div>

                        </div>
                        <div className="col-span-12 lg:col-span-4">
                            
                            <div className="p-5 bg-white rounded shadow">
                                <div className="font-bold text-base mb-5">Navigasi Soal</div>
                                <div className="grid grid-cols-12 gap-3 w-full mx-auto">
                                    {[1,2,3,4,5,6].map(i => (<NavButirSoal key={i} number={i}/>) )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center text-center mt-14 text-warmGray-500">
                        <strong>Smeducative</strong> <span className="ml-1 text-sm font-light"> is part of SMK Diponegoro Karanganyar</span>
                    </div>
                </div>
            </ExamBegin>
        </>
    )
}

function NavButirSoal({ number }) {
    return (
        <>
            <div className="col-span-2 relative">
                <div className="border border-blue-600 font-bold cursor-pointer bg-gray-200 py-2 text-center rounded-md hover:transform hover:scale-105 focus:scale-95 text-gray-600">{number}</div>

                <div className="absolute -top-3 -right-1 flex items-center justify-center">
                    <div className="bg-coolGray-700 text-white rounded-full border border-blue-400">
                        <span className="px-2">a</span>
                    </div>
                </div>
            </div>
        </>
    )
}