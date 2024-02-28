export default function Auth({ children }) {
  return (
    <>
      <main>
        <section className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 via-sky-400 to-sky-400 pb-3 shadow-md">
          {children}
        </section>
      </main>
    </>
  );
}
