import { useState } from "react";
import Head from 'next/head'

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import WelcomeBanner from "../../components/WelcomeBanner";
import ExamSchedule from "../../components/Dashboard/ExamSchedule";

import { useAuth } from '../../lib/hooks/auth'

export default function Dashboard() {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    
    const { user } = useAuth({ middleware: 'auth' })

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

                    <main className="bg-blueGray-100 min-h-screen">
                        <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">

                            {/* Welcome banner */}
                            <WelcomeBanner user={user.data} />

                            {/* Cards */}
                            <div className="grid grid-cols-12 gap-6">

                            {/* Exam schedule */}
                            <ExamSchedule />
                            
                            </div>

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