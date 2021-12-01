export default function BaseProfile({ data }) {
    return (
        <>
            <div className="relative bg-white rounded-lg shadow-md p-5">
                <div className="flex items-center justify-center flex-wrap space-x-4">
                    <div className="flex flex-col text-center px-5">
                        <div className="font-nunito font-bold text-lg">NIS</div>
                        <div className="text-sm font-poppins text-gray-700">{data.nis}</div>
                    </div>
                    <div className="flex flex-col text-center px-5">
                        <div className="font-nunito font-bold text-lg">NISN</div>
                        <div className="text-sm font-poppins text-gray-700">{data.nisn}</div>
                    </div>
                    <div className="flex flex-col text-center px-5">
                        <div className="font-nunito font-bold text-lg">TTL</div>
                        <div className="text-sm font-poppins text-gray-700">{data.ttl}</div>
                    </div>
                    <div className="flex flex-col text-center px-5">
                        <div className="font-nunito font-bold text-lg">UMUR</div>
                        <div className="text-sm font-poppins text-gray-700">{data.umur} tahun</div>
                    </div>
                </div>
            </div>
        </>
    )
}