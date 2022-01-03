import Head from 'next/head'
import ExamBegin from "../../components/Layouts/ExamBegin"
// import lottie
import Lottie from "react-lottie";
import data from "../../assets/successful.json"
import { useRouter } from "next/router";
import { useEffect } from "react";

function Header() {
    return (
        <div className="relative mx-auto flex items-center justify-center">
            <h1 className="text-2xl font-bold text-white font-poppins">Yay!!!</h1>
        </div>
    )
}

export default function Selesai() {
    const router = useRouter()

    const handleClick = () => {
        router.push("/dashboard")
    }

    useEffect(() => {
        const sound = new Audio(`/assets/sounds/eventually.ogg`)
        
        sound.play()
    }, [])

    const defaultOptions = {
        loop: true,
        autoplay: true,
        animationData: data,
        rendererSettings: {
            preserveAspectRatio: "xMidYMid slice"
        }
    };

    return (
        <>
            <Head>
                <title>Yay, Ujian Selesai !!</title>
            </Head>
            <ExamBegin header={<Header />}>
                <div className="relative flex items-center justify-center w-full">
                    <div className="bg-white rounded-md shadow w-full max-w-md p-5">
                        <Lottie options={defaultOptions} height={200} width={200} />

                        <div className="flex flex-col items-center justify-center mt-5">
                            <div className="text-xl font-extrabold font-nunito">Selesai</div>

                            <p className="font-poppins mt-3">Terima kasih telah menyelesaikan ujian</p>

                            <div className="mt-5">
                                <button onClick={handleClick} className="bg-gradient-to-r from-lightBlue-500 to-lightBlue-400 w-full py-2 px-6 rounded-md shadow text-white font-poppins">
                                    Kembali ke dashboard
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </ExamBegin>
        </>
    )
}