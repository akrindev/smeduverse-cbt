import QuestionSection from "./QuestionSection";
import NavigasiSoal from "./NavigasiSoal";

const QuestionComponent = () => {
  return (
    <div className='relative my-3 w-full max-w-7xl mx-auto'>
      <div className='grid grid-cols-12 gap-6 w-full mx-auto'>
        <div className='col-span-12 lg:col-span-8'>
          <QuestionSection />
        </div>
        {/* navigasi soal */}
        <NavigasiSoal />
      </div>
      <div className='flex items-center justify-center text-center mt-14 text-warmGray-500'>
        <strong>Smeducative</strong>
        <span className='ml-1 text-sm font-light'>
          is part of SMK Diponegoro Karanganyar
        </span>
      </div>
    </div>
  );
};

export default QuestionComponent;
