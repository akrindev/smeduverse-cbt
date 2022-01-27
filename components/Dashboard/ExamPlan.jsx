export default function ExamPlan({ plans, onSelectedPlan }) {
    return (
        <>
        <div>
            <h1 className="text-xl font-bold px-5 mb-5">Jenis Ujian</h1>

            <div className="grid grid-cols-12 gap-3 px-3">
                {plans && plans.map((plan, index) => (
                    <div key={plan.id} className="col-span-12 md:col-span-6 xl:col-span-4">
                        <div
                            className={`
                                flex flex-col items-start
                                bg-white shadow rounded-sm px-5 py-3 
                                border border-transparent hover:cursor-pointer 
                                hover:bg-green-100/90 hover:border-green-700 duration-150`}
                            onClick={() => onSelectedPlan(plan.id)}    
                        >
                            <div className="text-lg font-semibold">{plan.name}</div>
                            <div className="flex items-center text-sm">
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                <span>
                                    {plan.schedules_count} jadwal ujian
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        </>
    )
}