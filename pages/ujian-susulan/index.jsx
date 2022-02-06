import { useState } from "react";
import { ToastContainer, toast } from "react-toastify";

import Dashboard from "../../components/Layouts/Dashboard"
import Modal from "../../components/Dialog"
import DescriptionModalExam from "../../components/DescriptionModalExam";
import ButtonExamPage from "../../components/Dashboard/ButtonExamPage";
import { ThreeDots } from "../../components/Loading";

import { api } from "../../lib/hooks/auth"

export default function UjianSusulan() {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState('idle')
    const [token, setToken] = useState(null)
    const [error, setError] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState(null)

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // check if token is filled
        if (token && token.length <= 3) {
            setError(true)
            toast.error('Token tidak valid', {
                hideProgressBar: true,
                position: "top-left"
            })
        } else {
            setIsLoading('loading')
            // submit token
            await api.post(`/api/exam/paket/${token}/check-token`)
            .then((res) => {
                if(res.data.status == false) {
                    setError(true)
                    toast.error(res.data.message, {
                        hideProgressBar: true,
                        position: "top-left"
                    })
                } else {
                    setSelectedSchedule(res.data.data)
                    setIsOpen(true)
                }
            }).catch(err => console.error(err)).finally(() => setIsLoading('idle'))
        }
    }

    return (
        <Dashboard title={`Ujian Susulan`}>
            <div className="m-5">
                <h1 className="text-xl font-bold">Ujian Susulan</h1>
            </div>

            <div className="m-3 bg-white rounded shadow flex flex-col md:w-1/2">
                <div className="p-5">
                    <form
                        onSubmit={handleSubmit}
                    >
                        <h2 className="text-lg font-semibold">Masukkan token ujian</h2>
                        <div className="mt-3">
                            <input
                                type="text"
                                className={`
                                    w-full
                                    bg-slate-100 
                                    px-3 py-2 
                                    border ${error ? 'border-red-500 bg-red-50' : 'border-slate-200'}
                                    rounded`}
                                placeholder="token"
                                onChange={e => setToken(e.target.value)}
                                autoFocus
                                required/>
                        </div>
                        <div className="mt-3">
                            <button className="bg-blue-600 px-7 py-2 rounded text-white text-xs hover:bg-opacity-70">
                                {isLoading === 'loading' ? <ThreeDots /> : 'submit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <ToastContainer />            
            <Modal isOpen={isOpen} setIsOpen={setIsOpen} title="Informasi Ujian" description={<DescriptionModalExam data={selectedSchedule} />} action={<ButtonExamPage token={selectedSchedule?.token} />}/>
        </Dashboard>
    )
}