export default function ButtonKerjakan({ onClick, schedule }) {

    if(new Date(schedule.end_time) < new Date()) {
        return (<div className="text-center">
            <button className="bg-red-500 text-white px-3 py-1 opacity-50">telah berakhir</button>
        </div>)
    }

    if(new Date(schedule.start_time) > new Date()) {
        return (<div className="text-center">
            <button className="bg-green-600 text-white px-3 py-1 opacity-50">terjadwal</button>
        </div>)
    }

    if(schedule && schedule.answer_sheets.length == 0) {
        return (<div className="text-center">
        <button className="bg-green-500 rounded-full px-4 py-1 font-bold text-white shadow"
            onClick={onClick}
        >
            Kerjakan
            </button>
        </div>)
    }

    if(schedule && schedule.answer_sheets[0]?.status != 2) {
        return (<div className="text-center">
        <button className="bg-yellow-500 rounded-md px-3 py-1 text-white shadow"
            onClick={onClick}
        >
            Lanjutkan
            </button>
        </div>)
    }

    return (<div className="text-center text-rose-100 px-4 py-1 bg-rose-800 opacity-50">
      dikumpulkan
    </div>)
  
}