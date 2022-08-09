import Image from "next/image";
import { loaderImg } from "../../lib/loaderImg";
import { useAuth } from "../../lib/hooks/auth";
import { useExamInfo } from "../../store/useExamInfo";

const ExamUserInfo = ({ children }) => {
  const { user } = useAuth({ middleware: "auth" });
  const examInfo = useExamInfo((state) => state.examInfo);

  return (
    <div className='flex flex-col justify-between hover:cursor-pointer max-w-7xl mx-auto'>
      {user && (
        <>
          <div className='flex items-center justify-between'>
            <div className='flex items-center text-lg font-bold text-white space-x-2'>
              <Image
                src={`/assets/images/tutwurihandayani.png`}
                alt='Tutwuri Handayani'
                width={40}
                height={40}
                loader={loaderImg}
                className='mr-2'
                unoptimized
              />
              <span>CBT</span>
            </div>
            {children}
          </div>
          <div className='flex flex-col bg-white px-3 py-2 mt-3 -mb-6 rounded shadow'>
            <h2 className='text-lg font-bold'>{user.data.student.fullname}</h2>
            <div className='flex items-center text-sm text-gray-600'>
              {user.data.student.nipd} /
              {user.data.student.rombel_aktif[0]?.nama}
            </div>
            <div className='flex items-center'>
              <div className='text-sm text-gray-500 mr-2'>{examInfo.mapel}</div>
              <div className='text-sm text-gray-500'>
                kelas {examInfo.tingkatKelas}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExamUserInfo;
