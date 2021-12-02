import ExamBegin from "../../components/Layouts/ExamBegin"
// import lottie
import Lottie from "react-lottie";
import data from "../../assets/successful.json"

function Header() {
    return (
        <div className="relative mx-auto flex items-center justify-center">
            <h1 className="text-2xl font-bold text-white font-poppins">Yay!!!</h1>
        </div>
    )
}

export default function Selesai() {
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
            <ExamBegin header={<Header />}>
                <div className="relative flex items-center justify-center">
                    <div className="bg-white rounded-md shadow p-5">
                        <Lottie options={defaultOptions} height={200} width={200} />

                        <div className="flex items-center justify-center">

                            <div className="text-lg font-bold">Selesai</div>

                            <p>Terima kasih telah menyelesaikan ujian</p>
                        </div>

                    </div>
                </div>
            </ExamBegin>
        </>
    )
}