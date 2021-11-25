function HeaderProp({ body }) {
    return (
        <>              
            <div className="relative bg-gradient-to-r from-lightBlue-500 via-lightBlue-400 to-lightBlue-400 md:pt-32 pb-32 pt-12">
                <div className="w-full max-w-3xl px-4 md:px-10 mx-auto">
                    <div>
                        {body}
                    </div>
                </div>
            </div>
        </>
    )
}

export default function Authenticated({ header, children }) {
    return (
        <>
            <div className="relative bg-blueGray-100 min-h-screen pb-10">

                {header && <HeaderProp body={header}/>}
                
                <div className="w-full max-w-3xl px-4 md:px-10 mx-auto -mt-20">
                    {children}
                </div>
                
                <div className="w-full max-w-3xl px-4 md:px-10 mx-auto mt-14">
                    
                    <div className="text-center">
                        <strong className="text-red-700 block text-xl">♥</strong>
                        <strong className="text-lg">Smeducative</strong> <span className="font-thin">is part of SMK Diponegoro Pekalongan</span>
                    </div>
                </div>


            </div>
        </>
    )
}

