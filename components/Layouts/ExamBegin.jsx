function Header({ body }) {
    return (
        <>              
            <div className="relative bg-gradient-to-r from-sky-500 via-sky-400 to-sky-400 pb-32 pt-10">
                <div className="w-full px-4 md:px-10 mx-auto">
                        {body}
                </div>
            </div>
        </>
    )
}

export default function ExamBegin({ header, children }) {
    return (
        <>
            <div className="relative bg-blueGray-100 min-h-screen pb-10">

                {header && <Header body={header}/>}
                
                <div className="w-full px-4 md:px-10 mx-auto -mt-20">
                    {children}
                </div>
            </div>
        </>
    )
}
