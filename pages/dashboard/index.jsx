import { useState, useEffect } from "react";
import Head from 'next/head'

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import WelcomeBanner from "../../components/WelcomeBanner";
import ExamSchedule from "../../components/Dashboard/ExamSchedule";
import ExamPlan from "../../components/Dashboard/ExamPlan";

import { api, useAuth } from '../../lib/hooks/auth'

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [plans, setPlans] = useState([])
    const [selectedPlan, setSelectedPlan] = useState(0)

    const { user } = useAuth({ middleware: 'auth' })

    useEffect(() => {
        const getPlanList = async () => {
            await api.get('/api/exam/exam-plan-list').then((res) => {
                setPlans(res.data)
            }).catch(err => console.log(err))
        }

        getPlanList()
    }, [])

    const handleSelectedPlan = (id) => {
        setSelectedPlan(id)
    }

    return (
        <>
            <Head>
                <title>Dashboard</title>
            </Head>
            <div className="flex h-screen overflow-hidden">

            {/* Sidebar */}
                <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

                {/* Content area */}
                <div className="relative flex flex-col flex-1 overflow-y-auto overflow-x-hidden">

                    {user ? (<>
                        {/*  Site header */}
                        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} user={user.data} />

                        <main className="bg-slate-100 pb-14 min-h-screen">
                            <div className="w-full max-w-9xl mx-auto pb-16">
                                {/* Welcome banner */}
                                <WelcomeBanner user={user.data} />

                                {/* Exam schedule */}
                                {(selectedPlan == 0 && plans)
                                    ? <ExamPlan plans={plans} onSelectedPlan={handleSelectedPlan}/>
                                    : <ExamSchedule planId={selectedPlan} onBack={() => setSelectedPlan(0)}/>
                                }
                            </div>
                        </main>
                    </>) : (<>
                        <div className="flex items-center justify-center py-14 bg-white shadow rounded">
                            Loading . . .
                        </div>
                    </>
                    )}

                </div>
            </div>
        </>
    );
}