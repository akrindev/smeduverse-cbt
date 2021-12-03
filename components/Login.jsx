import { useRouter } from 'next/router';
import Image from 'next/image'
import Head from 'next/head'

export default function Login() {
    const router = useRouter();

    const login = (e) => {
        e.preventDefault()
        router.push('/dashboard')
    }

    return (
        <>
            <Head>
                <title>CBT Login</title>
            </Head>
            <div className="container mx-auto px-4 h-full">
                <div className="flex content-center items-center justify-center h-full">
                <div className="w-full lg:w-4/12 px-4">
                    <div className="relative flex flex-col min-w-0 break-words w-full mb-6 shadow-lg rounded-md bg-white border-0">
                        <div className="rounded-t mb-0 px-6 py-6">
                            <div className="text-center mb-3">
                                <div className="flex items-center justify-center">
                                    <Image 
                                        src={`/assets/images/tutwurihandayani.png`}
                                        alt="Tutwuri Handayani"
                                        width={65}
                                        height={65}
                                    />
                                </div>
                                <h6 className="text-blue-700 text-2xl font-poppins font-bold">
                                    Computer Based Test
                                </h6>
                                <span className="text-sm text-lightBlue-600 font-nunito">🎉 Sebelum masuk, identifikasi diri kamu dulu yuk</span>
                            </div>
                            
                            <hr className="mt-6 border-b-1 border-blueGray-300" />
                        </div>
                        <div className="flex-auto px-4 lg:px-10 py-10 pt-0">
                            <form
                                onSubmit={login}
                            >
                            <div className="relative w-full mb-3">
                                <label
                                    className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                                    htmlFor="grid-password"
                                >
                                    NIS / NISN
                                </label>
                                <input
                                    type="text"
                                    className="px-3 py-3 placeholder-blueGray-300 text-blueGray-900 bg-blueGray-100 rounded text-sm shadow focus:bg-blue-50 w-full"
                                    placeholder="NIS / NISN"
                                    autoFocus
                                    autoComplete="username"
                                />
                            </div>

                            <div className="relative w-full mb-3">
                                <label
                                    className="block uppercase text-blueGray-600 text-xs font-bold mb-2"
                                    htmlFor="grid-password"
                                >
                                Password
                                </label>
                                <input
                                    type="password"
                                    className="px-3 py-3 placeholder-blueGray-300 text-blueGray-900 bg-blueGray-100 rounded text-sm shadow focus:bg-blue-50 w-full"
                                    placeholder="Password"
                                    autoComplete="current-password"
                                />
                            </div>

                            <div className="text-center mt-6">
                                <button
                                className="bg-lightBlue-600 text-white hover:bg-lightBlue-800 text-sm font-bold uppercase px-6 py-3 rounded-xl shadow-lg hover:shadow-lg outline-none focus:outline-none mr-1 mb-1 w-full ease-linear transition-all duration-150 disabled:opacity-75"
                                type="submit"
                                >
                                    Masuk
                                </button>
                            </div>
                            </form>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap mt-6 relative">
                        <div className="w-full text-center">
                            <strong className="text-white font-bol">Smeducative</strong> <span className="text-sm text-white font-thin">is part of SMK Diponegoro Karanganyar</span>
                        </div>
                    </div>

                </div>
                </div>
            </div>
        </>
    )
}