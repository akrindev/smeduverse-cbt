import ExamBegin from "../../components/Layouts/ExamBegin"

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
                                <div className="p-5 border-b border-gray-200 font-nunito font-semibold text-xl">
                                    Soal ke 32
                                </div>
                                {/* pertanyaan */}  
                                <div className="p-5 font-nunito font-normal text-base" dangerouslySetInnerHTML={dangerHTML()} />

                                <div className="border-b border-gray-200"></div>

                                <div className="p-5">
                                    This is the answer option
                                </div>

                            </div>

                        </div>
                        <div className="col-span-12 lg:col-span-4">
                            
                            <div className="p-5 bg-white rounded shadow">
                                <div className="font-bold text-base mb-5">Navigasi soal</div>
                                <div className="grid grid-cols-12 gap-3 w-full mx-auto">
                                    {[1,2,3,4,5,6].map(i => (<div className="col-span-2 cursor-pointer bg-gray-100 py-2 text-center rounded-md hover:transform hover:scale-105 focus:scale-95 text-gray-600 border border-gray-600 font-bold" key={i}>{i}</div>) )}
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
