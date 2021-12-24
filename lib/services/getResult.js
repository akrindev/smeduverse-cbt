import Router from 'next/router';
import { toast } from 'react-toastify';
import { api } from '../hooks/auth';

export const getResult = async (sheetId) => {

    return new Promise((resolve, reject) => {
        api.post('/api/exam/get-result', {
            sheet_id: sheetId
        }).then(res => {
            if (res.status == 200) {
                resolve(res.data);
                toast.success('Lembar Ujian berhasil di kumpulkan')
                //    remove local storaage exam and answer
                setTimeout(() => {
                    localStorage.removeItem('exam-questions')
                    localStorage.removeItem('exam-saved-answers')
                    Router.push('/exam/selesai')
                }, 800)
            }
        }).catch(err => reject(err))
    })
}