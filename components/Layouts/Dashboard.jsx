import { useState, useEffect } from "react";
import Head from 'next/head'

import Sidebar from "../../components/Sidebar";
import Header from "../../components/Header";

import { useAuth } from '../../lib/hooks/auth'

export default function Dashboard({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const { user } = useAuth({ middleware: 'auth' })

    return (
        <>
            <Head>
                <title>{title}</title>
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
                                {/* children */}
                                {children}
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