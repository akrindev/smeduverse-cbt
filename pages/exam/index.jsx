import Head from 'next/head'
import { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { ToastContainer, toast } from 'react-toastify';
import _ from 'lodash';

import { api } from '../../lib/hooks/auth'

import useLocalStorage from '../../lib/hooks/useLocalStorage';

import ExamBegin from "../../components/Layouts/ExamBegin"
import QuestionOption from "../../components/QuestionOption"
import NavButirSoal from '../../components/Exam/NavButirSoal';
import Modal from '../../components/Dialog'

function NavHead() {
    return (
        <>
            <div className="flex justify-between hover:cursor-pointer max-w-7xl mx-auto">
                <div className="text-lg font-bold text-white">
                    Computer Based Test
                </div>
                <div className="rounded-xl text-xs shadow-2xl px-4 py-1 bg-white">sisa waktu: 34 menit</div>
            </div>
        </>
    )
}

export default function ExamIndex() {
    const [warn, setWarn] = useState(0)
    const [question, setQuestion] = useState({})
    const [questions, setQuestions] = useLocalStorage('exam-questions')
    const [savedAnswers, setSavedAnswers] = useLocalStorage('exam-saved-answers')
    const [chosenAnswer, setChosenAnswer] = useState(null)
    const [questionIndex, setQuestionIndex] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    // dialog state
    const [isOpenDialog, setIsOpenDialog] = useState(false)

    const stopExam = () => {
        setIsOpenDialog(true)
        console.log('clicked')
    }

    const handleChosen = async (value) => {
        setIsSaving(true)
        // update saved answers
        const answer = _.find(savedAnswers, (item) => item.exam_soal_id === question.id)

        await api.post('/api/exam/save-answer', {
            'exam_answer_sheet_id': answer.exam_answer_sheet_id,
            'exam_soal_id': answer.exam_soal_id,
            'answer_chosen_id': value
        }).then((res) => {
            setSavedAnswers(savedAnswers => {
                const newSavedAnswers = _.find(savedAnswers, (item) => item.exam_soal_id === question.id)
                newSavedAnswers.answer_chosen_id = value
    
                return savedAnswers
            })
        }).catch((err) => console.log(err)).finally(() => {
            setIsSaving(false)
        })
    }

    const isChosen = (chosenId) => {
        const chosen = _.find(savedAnswers, (item) => item.exam_soal_id === chosenId)

        return chosen.answer_chosen_id != null
    }

    // prevent leave window
    useEffect(() => {
        // on blur
        window.onblur = () => {
            // alert("Peringatan meninggalkan halaman ujian")
            setWarn(prev => prev + 1)
            toast.error('Kamu meninggalkan halaman ujian, peringatan ditambahkan')
            const sound = new Audio('/assets/sounds/goes.ogg')
            sound.play()
        }
    }, [warn])

    const getChosenAnswer = () => {
        const chosen = _.find(savedAnswers, { exam_soal_id: question?.id })

        setChosenAnswer(chosen)
    }

    useEffect(() => {
        
        if(!questions || !savedAnswers) {
            router.replace('/dashboard')
        }
        
        setQuestion(questions[questionIndex])
        getChosenAnswer()
    }, [])
    
    useEffect(() => {
        setQuestion(questions[questionIndex])
        getChosenAnswer()
    }, [questionIndex, question, savedAnswers])

    const router = useRouter()

    const dangerHTML = () => {
        return {
            __html: question?.question ?? ""
        }
    }

    return (
        <>
            <Head>
                <title>Ujian</title>
            </Head>
            <ExamBegin header={<NavHead warn={warn} />}>

                <div className="relative my-3 w-full max-w-7xl mx-auto">
                    <div className="grid grid-cols-12 gap-6 w-full mx-auto">
                        <div className="col-span-12 lg:col-span-8">
                            <div className="bg-white rounded shadow">
                                {/* header info */}
                                <div className="px-5 py-3 border-b border-gray-200 font-nunito font-semibold text-xl">
                                    Pertanyaan {questionIndex + 1}
                                </div>
                                {/* pertanyaan */}  
                                <div className="px-4 py-3 font-nunito font-normal text-base" dangerouslySetInnerHTML={dangerHTML()} />

                                <div className="border-b border-gray-100"></div>

                                <div className="p-3">
                                    <QuestionOption data={question.choices} chosen={chosenAnswer} onChosen={handleChosen} isSaving={isSaving}/>
                                </div>

                                <div className="p-3 pb-5">
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => setQuestionIndex(prev => prev - 1)} className="px-3 py-2 bg-gray-100 border border-gray-400 text-sm rounded-md disabled:opacity-50" disabled={questionIndex == 0}>
                                            Soal Sebelumnya
                                        </button>
                                        <button className="px-3 py-2 bg-yellow-500 border border-yellow-600 text-gray-100 text-sm rounded-md">
                                            Ragu-ragu
                                        </button>
                                        <button onClick={() => setQuestionIndex(prev => prev + 1)} className="px-3 py-2 bg-gray-100 border border-gray-400 text-sm rounded-md disabled:opacity-50" disabled={questions && questionIndex == questions.length - 1}>
                                            Soal Berikutnya
                                        </button>
                                    </div>
                                </div>

                            </div>

                        </div>
                        <div className="col-span-12 lg:col-span-4">
                            
                            <div className="p-4 bg-white rounded shadow">
                                <div className="font-bold text-base mb-5">Navigasi Soal</div>
                                <div className="grid grid-cols-10 gap-2 w-full mx-auto">
                                    {questions && questions.map((question, index) => (
                                        <NavButirSoal
                                            isChosen={isChosen(question.id)}
                                            onClick={() => setQuestionIndex(index)}
                                            key={question.id}
                                            number={index+1}/>)
                                    )}
                                </div>
                                <div className="mt-5 flex justify-end">
                                    <button
                                        className="bg-gray-200 text-sm px-4 py-1 rounded-lg border border-gray-500 font-medium"
                                        onClick={stopExam}
                                        >
                                            Hentikan Ujian
                                    </button>
                                </div>
                                <div className="mt-3">
                                    <div className="flex flex-col items-start">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-2 w-2 bg-green-500 rounded"></div> <span className="text-xs text-gray-600">soal telah dijawab</span> 
                                        </div>
                                        <div className="flex items-center space-x-3 mt-1">
                                            <div className="h-2 w-2 bg-yellow-500 rounded"></div> <span className="text-xs text-gray-600">ragu-ragu</span> 
                                        </div>
                                        <div className="flex items-center space-x-3 mt-1">
                                            <div className="h-2 w-2 bg-gray-700 rounded"></div> <span className="text-xs text-gray-600">belum dijawab</span> 
                                        </div>
                                        <div className="flex items-center mt-5 text-xs font-medium">
                                            <div className="text-red-600 mr-1">Peringatan</div> <span className="text-xs text-red-900 font-bold"> {warn} </span> 
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center justify-center text-center mt-14 text-warmGray-500">
                        <strong>Smeducative</strong> <span className="ml-1 text-sm font-light"> is part of SMK Diponegoro Karanganyar</span>
                    </div>
                </div>
                <ToastContainer />
            </ExamBegin>
            <Modal isOpen={isOpenDialog} setIsOpen={setIsOpenDialog} title={`Yakin udah selesai?`} description={<ChosenAnswer answers={savedAnswers}/>} action={<ButtonResult sheetId={savedAnswers && savedAnswers[0]?.exam_answer_sheet_id} />}/>
        </>
    )
}

function ButtonResult({ sheetId }) {
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter();

    const handleClick = async () => {
        setIsLoading(true)
        await api.post('/api/exam/get-result', {
            sheet_id: sheetId
        }).then(res => {
           if(res.status == 200) {
               toast.success('Lembar Ujian berhasil di kumpulkan')
                //    remove local storaage exam and answer
                window.localStorage.removeItem('exam-questions')
                window.localStorage.removeItem('exam-saved-answers')
               router.replace('/exam/selesai')
           } 
        })
        .catch(err => console.error(err)).finally(() => setIsLoading(false))
    }

    return (<>
        <button className={`bg-green-500 text-white rounded-md px-4 py-1 disabled:opacity-60`} disabled={isLoading} onClick={handleClick}>
            {isLoading ? 'Mengumpulkan' : 'Kumpulkan'}
        </button>
    </>
    )
}

function ChosenAnswer({ answers }) {
    
    // get chosen answer where answer_chosen_id is not null
    const chosenAnswer = _.filter(answers, (answer) => answer.answer_chosen_id != null).length || 0
    const emptyAnswer = _.filter(answers, (answer) => answer.answer_chosen_id == null).length || 0
    
    return (
        <>
            <div>
                <span>Udah di koreksi belom?</span>
                <div className="divide-black divide-y my-2"></div>
                <div className="flex items-center space-x-3">
                    <div className="flex flex-col items-center">
                        <strong>Dijawab</strong>
                        <span>{chosenAnswer}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <strong>Kosong</strong>
                        <span>{emptyAnswer}</span>
                    </div>
                    <div className="flex flex-col items-center">
                        <strong>Total</strong>
                        <span>{answers.length}</span>
                    </div>
                </div>
            </div>
        </>
    )
}

