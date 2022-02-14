import useSWR from 'swr'
import Axios from 'axios'
import axiosRetry from 'axios-retry'
import { useEffect } from 'react'
import { useRouter } from 'next/router'

const api = Axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
    }
})

axiosRetry(api, {
    retries: 15,
    retryDelay: (retryCount) => {
        return 3000
    }
})

api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    error => Promise.reject(error)
)

api.interceptors.response.use(
    response => response,
    error => {
        if (error.response.status === 401) {
            localStorage.removeItem('token')
            // window.location.pathname = '/'
            return
        }
        return Promise.reject(error)
    }
)

const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
    const router = useRouter()

    const { data: user, error, mutate } = useSWR('/api/user', () =>
        api
            .get('/api/user')
            .then(res => res.data)
            .catch(error => {
                if (error.response.status != 409) throw error
            }),
    )

    const login = async ({ setErrors, setStatus, ...props }) => {
        setErrors([])
        setStatus("loading")

        api
            .post('/student-login', props)
            .then((res) => {
                localStorage.setItem('token', res.data.token)
                mutate(res.data.user)
            })
            .catch(error => {
                console.log(error)
                if (error.response?.status != 422) throw error

                setErrors(Object.values(error.response?.data.errors).flat())
            }).finally(() => setStatus("idle"))
    }


    const logout = async () => {
        if (! error) {
            localStorage.removeItem('token')
            mutate(null)
        }

        window.location.pathname = '/'
    }

    useEffect(() => {
        if (middleware == 'guest' && redirectIfAuthenticated && user) router.push(redirectIfAuthenticated)
        if (middleware == 'auth' && error) logout()
    }, [user, error])

    return {
        user,
        login,
        logout,
    }
}


export {
    api,
    useAuth,
}