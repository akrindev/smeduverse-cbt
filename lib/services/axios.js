// instance axios es module
import Axios from 'axios';

const axios = Axios.create({
    baseURL: process.env.NEXT_PUBLIC_BACKEND_URL,
    headers: {
        // json
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
});

export default axios
