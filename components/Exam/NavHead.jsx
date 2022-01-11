import Image from 'next/image'
import { useEffect, useState } from 'react';
import { loaderImg } from '../../lib/loaderImg';
import { useAuth } from '../../lib/hooks/auth';

export default function NavHead({ dateEnd, mapel, tingkatKelas }) {
    const [fullname, setFullname] = useState('');
    const [rombel, setRombel] = useState('');
    const [nisn, setNisn] = useState(null)
    const [matPel, setMatPel] = useState(mapel)
    const { user } = useAuth({ middleware: 'auth'});

    useEffect(() => {
        if(user) {
            setFullname(user.data.student.fullname)
            setNisn(user.data.student.nipd)
            setRombel(user.data.student.rombel_aktif[0]?.nama)
            setMatPel(mapel)
        }
    })

    let hour = Math.floor((dateEnd / 3600000) % 24); // time diff's hours (modulated to 24)
    let min = Math.floor((dateEnd / 60000) % 60); // time diff's minutes (modulated to 60)
    let sec = Math.floor((dateEnd / 1000) % 60); // time diff's seconds (modulated to 60)

    return (
        <>
            <div className="flex flex-col justify-between hover:cursor-pointer max-w-7xl mx-auto">
                <div className='flex items-center justify-between'>
                    <div className="flex items-center text-lg font-bold text-white space-x-2">
                        <Image 
                            src={`/assets/images/tutwurihandayani.png`}
                            alt="Tutwuri Handayani"
                            width={40}
                            height={40}
                            loader={loaderImg}
                            className='mr-2'
                            unoptimized
                        />
                        <span>
                        CBT
                        </span>
                    </div>
                    <div className={`rounded-xl text-xs shadow-2xl px-4 py-1 font-semibold ${ (hour === 0 && min <= 5) ? 'bg-red-700 text-white' : 'bg-white'}`}>
                        sisa waktu: {`${hour}j ${min}m ${sec}d`}
                    </div>
                </div>
                <div className="flex flex-col bg-white px-3 py-2 mt-3 -mb-6 rounded shadow">
                    <h2 className="text-lg font-bold">{fullname}</h2>
                    <div className="flex items-center text-sm text-gray-600">
                        {nisn} / {rombel}
                    </div>
                    <div className="flex items-center">
                        <span className='text-sm text-gray-500 mr-2'>{matPel}</span> 
                        <span className='text-sm text-gray-500'> kelas {tingkatKelas}</span>
                    </div>
                </div>
            </div>
        </>
    )
}