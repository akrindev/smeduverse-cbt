export default function LatestExam() {

    const data = [
        {
            mapel: 'Matematika',
            paket: 'Ulangan Tengah Semester',
            tanggal: '29 Nov 2021 07:45'
        },
        {
            mapel: 'Simdig',
            paket: 'Ulangan Tengah Semester',
            tanggal: '29 Nov 2021 09:45'
        },
        {
            mapel: 'Bahasa Indonesia',
            paket: 'Ulangan Tengah Semester',
            tanggal: '29 Nov 2021 10:45'
        },
        {
            mapel: 'Bahasa Indonesia',
            paket: 'Ulangan Tengah Semester',
            tanggal: '29 Nov 2021 10:45'
        },
        {
            mapel: 'Bahasa Indonesia',
            paket: 'Ulangan Tengah Semester',
            tanggal: '29 Nov 2021 10:45'
        },
        {
            mapel: 'Bahasa Indonesia',
            paket: 'Ulangan Tengah Semester',
            tanggal: '29 Nov 2021 10:45'
        },
    ]

    return (
        <>
            {data && data.map((item) => {
                return (<div className="bg-white shadow-lg rounded-md mt-5 px-3 py-2 hover:bg-lightBlue-700 hover:text-white duration-200">
                    <div className="flex">
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