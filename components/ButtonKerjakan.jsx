export default function ButtonKerjakan({ onClick, schedule }) {

    if(schedule && schedule.answer_sheets[0]?.status == 2) {
        return (<div className="text-center text-rose-100 px-4 py-1 bg-rose-800 opacity-50">
      dikumpulkan
    </div>)
    }

    if(new Date(schedule.end_time) < new Date()) {
        return (<div className="text-center">
            <button className="w-full bg-red-500 text-white px-4 py-1 opacity-50">telah berakhir</button>
        </div>)
    }

    if(new Date(schedule.start_time) > new Date()) {
        return (<div className="text-center">
            <button className="w-full bg-green-600 text-white px-4 py-1 opacity-50">terjadwal</button>
        </div>)
    }

    if(schedule && schedule.answer_sheets.length == 0) {
        return (<div className="text-center">
        <button className="w-full bg-green-500 rounded-md px-4 py-1 font-bold text-white shadow"
            onClick={onClick}
        >
            Kerjakan
            </button>
        </div>)
    }

    if(schedule && schedule.answer_sheets[0]?.status != 2) {
        return (<div className="text-center">
        <button className="w-full bg-yellow-500 rounded-md px-4 py-1 text-white shadow"
            onClick={onClick}
        >
            Lanjutkan
            </button>
        </div>)
    }  
}