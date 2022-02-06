import { useState, useEffect } from "react";

import WelcomeBanner from "../../components/WelcomeBanner";
import ExamSchedule from "../../components/Dashboard/ExamSchedule";
import ExamPlan from "../../components/Dashboard/ExamPlan";
import Dashboard from "../../components/Layouts/Dashboard";

import { api, useAuth } from '../../lib/hooks/auth'

export default function DashboardHome() {
    const [plans, setPlans] = useState([])
    const [selectedPlan, setSelectedPlan] = useState(0)

    const { user } = useAuth({ middleware: 'auth' })

    useEffect(() => {
        const getPlanList = async () => {
            await api.get('/api/exam/exam-plan-list').then((res) => {
                setPlans(res.data)
            }).catch(err => console.log(err))
        }

        getPlanList()
    }, [])

    const handleSelectedPlan = (id) => {
        setSelectedPlan(id)
    }

    return (
        <Dashboard title="Dashboard">
            {/* Welcome banner */}
            {user && <WelcomeBanner user={user.data} />}
    
            {/* Exam schedule */}
            {(selectedPlan == 0 && plans)
                ? <ExamPlan plans={plans} onSelectedPlan={handleSelectedPlan}/>
                : <ExamSchedule planId={selectedPlan} onBack={() => setSelectedPlan(0)}/>
            }
        </Dashboard>                                
    );
}