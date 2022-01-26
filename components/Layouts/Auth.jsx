export default function Auth({ children }) {
    return (
        <>
            <main>
                <section className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 via-sky-400 to-sky-400 pb-3 shadow-md">
                    {children}
                    
                    <div className="flex flex-wrap mb-10">
                        <div className="w-full text-center text-xs md:text-sm opacity-70">
                            <strong className="text-white font-bold">Smeducative</strong> <span className="text-white font-thin">is part of SMK Diponegoro Karanganyar</span>
                        </div>
                    </div>
                </section>
            </main>
        </>
    );
}