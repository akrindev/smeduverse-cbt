import Head from 'next/head'
import Image from 'next/image'
import { useEffect, useState, useCallback } from "react"
import { ToastContainer, toast } from 'react-toastify';
import find from 'lodash/find';
import filter from 'lodash/filter'

import { api } from '../../lib/hooks/auth'
import { getResult } from '../../lib/services/getResult'
import { loaderImg } from '../../lib/loaderImg';

import useLocalStorage from '../../lib/hooks/useLocalStorage';

import ExamBegin from "../../components/Layouts/ExamBegin"
import QuestionOption from "../../components/QuestionOption"
import NavButirSoal from '../../components/Exam/NavButirSoal';
import NavHead from '../../components/Exam/NavHead';
import Modal from '../../components/Dialog'


export default function ExamIndex() {
    const [question, setQuestion] = useState({})
    const [questions, setQuestions] = useLocalStorage('exam-questions')
    const [savedAnswers, setSavedAnswers] = useLocalStorage('exam-saved-answers')
    const [examInfo, setExamInfo] = useLocalStorage('exam-info');
    const [chosenAnswer, setChosenAnswer] = useState(null)
    const [questionIndex, setQuestionIndex] = useState(0)
    const [isSaving, setIsSaving] = useState(false)
    const [endTime, setEndTime] = useState(null)
    // dialog state
    const [isOpenDialog, setIsOpenDialog] = useState(false)

    if (!questions && !savedAnswers) {
        if(typeof window !== "undefined") {
            window.location.href = '/dashboard'
        }
    }

    const stopExam = () => {
        setIsOpenDialog(true)
    }

    const handleChosen = async (value) => {
        setIsSaving(true)
        // update saved answers
        const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id)

        await api.patch('/api/exam/save-answer', {
            'exam_answer_sheet_id': answer.exam_answer_sheet_id,
            'exam_soal_id': answer.exam_soal_id,
            'answer_chosen_id': value
        }).then((res) => {
            setSavedAnswers(savedAnswers => {
                const newSavedAnswers = find(savedAnswers, (item) => item.exam_soal_id === question.id)
                newSavedAnswers.answer_chosen_id = value

                return savedAnswers
            })
        }).catch((err) => console.log(err)).finally(() => {
            setIsSaving(false)
        })
    }

    const handleRagu = async (value) => {
        setIsSaving(true)
        // update saved answers
        const answer = find(savedAnswers, (item) => item.exam_soal_id === question.id)

        await api.patch('/api/exam/ragu-answer', {
            'exam_answer_sheet_id': answer.exam_answer_sheet_id,
            'exam_soal_id': answer.exam_soal_id,
            'ragu': answer.ragu === 1 ? 0 : 1
        }).then((res) => {
            setSavedAnswers(savedAnswers => {
                const newSavedAnswers = find(savedAnswers, (item) => item.exam_soal_id === question.id)
                newSavedAnswers.ragu = answer.ragu === 1 ? 0 : 1

                return savedAnswers
            })
        }).catch((err) => console.log(err)).finally(() => {
            setIsSaving(false)
        })
    }

    const isChosen = (chosenId) => {
        const chosen = find(savedAnswers, (item) => item.exam_soal_id === chosenId)

        return chosen.answer_chosen_id != null
    }

    const isRagu = (chosenId) => {
        return find(savedAnswers, (item) => item.exam_soal_id === chosenId)?.ragu == 1
    }

    const handleWarn = useCallback(
        (event) => {
            api.patch('/api/exam/warn-exam', {
                sheet_id: examInfo.sheet_id
            }).then(res => {
                setExamInfo(prev => {
                    prev.warn = res.data?.warn || 0
                    return prev
                })

            }).catch(err => console.error(err));

            toast.error('Kamu meninggalkan halaman ujian, peringatan ditambahkan')
            const sound = new Audio('/assets/sounds/goes.ogg')
            sound.play()
        },
        [setExamInfo],
    )

    const handleInterval = useCallback((event) => {
        const time = new Date(examInfo.end_time) - new Date()

        setEndTime(prev => time)
    }, [setEndTime])

    // listening to interval event
    useEffect(() => {
          if(endTime && endTime < 2000) {
            getResult(savedAnswers && savedAnswers[0]?.exam_answer_sheet_id).then((res) => {
                toast.success('ujian di selesaikan')
            })
          }

        const time = setInterval(handleInterval , 1000)

        return () => clearInterval(time)
    }, [endTime])
    

    // prevent leave window
    useEffect(() => {
        
        if (typeof global.window !== "undefined") {
            global.window.addEventListener('blur', handleWarn)
        }

        return () => {
            if (typeof global.window !== "undefined") {
                global.window.removeEventListener('blur', handleWarn)
            }
        }
    }, [handleWarn])

    useEffect(() => {
        const getChosenAnswer = () => {
            const chosen = find(savedAnswers, { exam_soal_id: question?.id })

            setChosenAnswer(chosen)
        }

        if (questions && questions.length > 0) {
            setQuestion(questions[questionIndex])
            getChosenAnswer()
        }
    }, [questionIndex, question, savedAnswers])

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
            <ExamBegin header={<NavHead dateEnd={endTime} mapel={examInfo?.mapel} tingkatKelas={examInfo?.tingkat} />}>

                <div className="relative my-3 w-full max-w-7xl mx-auto">
                    <div className="grid grid-cols-12 gap-6 w-full mx-auto">
                        <div className="col-span-12 lg:col-span-8">
                            <div className="bg-white rounded shadow">
                                {/* header info */}
                                <div className="p-3 border-b border-gray-200 font-nunito font-semibold text-lg">
                                    Soal {questionIndex + 1} / {questions && questions.length}
                                </div>
                                {/* pertanyaan */}
                                <div className="px-4 py-3 font-roboto font-normal text-sm" dangerouslySetInnerHTML={dangerHTML()} />

                                <div className="border-b border-gray-100"></div>

                                <div className="p-3">
                                    <QuestionOption data={question.choices} chosen={chosenAnswer} onChosen={handleChosen} isSaving={isSaving} />
                                </div>

                                <div className="p-3 pb-5" key={question.id}>
                                    <div className="flex items-center justify-between">
                                        <button onClick={() => setQuestionIndex(prev => prev - 1)} className="px-3 py-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50" disabled={questionIndex == 0}>
                                            Soal Sebelumnya
                                        </button>
                                        <button className={`px-3 py-2 ${questions && isRagu(question.id) ? 'bg-yellow-500 text-gray-100' : 'bg-white text-yellow-500'} border border-yellow-600  text-xs rounded-md`} onClick={handleRagu}>
                                            Ragu-ragu
                                        </button>
                                        <button onClick={() => setQuestionIndex(prev => prev + 1)} className="px-3 py-2 bg-gray-100 border border-gray-400 text-xs rounded-md disabled:opacity-50" disabled={questions && questionIndex == questions.length - 1}>
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
                                            isRagu={isRagu(question.id)}
                                            onClick={() => setQuestionIndex(index)}
                                            key={question.id}
                                            number={index + 1} />)
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
                                            <div className="text-red-600 mr-1">Peringatan</div> <span className="text-xs text-red-900 font-bold"> {examInfo && examInfo.warn} </span>
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
            <Modal isOpen={isOpenDialog} setIsOpen={setIsOpenDialog} title={`Yakin udah selesai?`} description={<ChosenAnswer answers={savedAnswers} />} action={<ButtonResult sheetId={savedAnswers && savedAnswers[0]?.exam_answer_sheet_id} />} />
        </>
    )
}

function ButtonResult({ sheetId }) {
    const [isLoading, setIsLoading] = useState(false)
    const [savedAnswers, setSavedAnswers] = useLocalStorage('exam-saved-answers')

    const handleClick = async () => {
        setIsLoading(true)
        await getResult(savedAnswers && savedAnswers[0]?.exam_answer_sheet_id).finally(() => setIsLoading(false))
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
    const chosenAnswer = filter(answers, (answer) => answer.answer_chosen_id != null).length || 0
    const emptyAnswer = filter(answers, (answer) => answer.answer_chosen_id == null).length || 0

    return (
        <>
            <div>
                <div className="flex items-center justify-center mb-5">
                    <Image
                        loader={loaderImg}
                        src={`/assets/images/yay.png`}
                        width={160}
                        height={160}
                    />
                </div>
                <span>Pastikan untuk mengoreksi sebelum menyelesaikan ujian 🎉</span>
                <div className="divide-black my-5"></div>
                <div className="flex items-center space-x-3 w-full">
                    <div className="flex flex-col items-center w-full">
                        <strong>Dijawab</strong>
                        <span>{chosenAnswer}</span>
                    </div>
                    <div className="flex flex-col items-center w-full">
                        <strong>Kosong</strong>
                        <span>{emptyAnswer}</span>
                    </div>
                    <div className="flex flex-col items-center w-full">
                        <strong>Total</strong>
                        <span>{answers.length}</span>
                    </div>
                </div>
                <div className="divide-black my-5"></div>
            </div>
        </>
    )
}

