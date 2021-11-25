export default function Auth({ children }) {
    return (
        <>
            <main>
                <section className="relative w-full h-full py-40 min-h-screen">
                    <div
                        className="absolute top-0 w-full h-full bg-gradient-to-r from-lightBlue-500 via-lightBlue-400 to-lightBlue-400 bg-no-repeat bg-full"
                    ></div>
                    {children}
                </section>
            </main>
        </>
    );
}