import axios, { AxiosError} from "axios";
import { destroyCookie, parseCookies, setCookie } from 'nookies'

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue:any = [];

export const api = axios.create({
    baseURL: "http://localhost:3333",
    headers: {
        Authorization: `Bearer ${cookies['tesouroBtAuth.token']}`
    }
})

export function signOut(){
    destroyCookie(undefined, "tesouroBtAuth.token")
    destroyCookie(undefined, "tesouroBtAuth.refreshToken")

    window.location.href = "/"; 
}

api.interceptors.response.use(response => {
    return response
}, (error: AxiosError) => {
    if(error.response?.status === 401){
        if(error.response.data?.code === 'token.expired'){
            cookies = parseCookies()

            const{'tesouroBtAuth.refreshToken' : refreshToken} = cookies
            const originalConfig = error.config

            if(!isRefreshing){
                api.post('/refresh', {
                    refreshToken,
                }).then( response => {
                    const {token} = response.data;

                    setCookie(undefined, "tesouroBtAuth.token", token, {
                        maxAge: 60 * 60 * 24 * 30,
                        path: "/"
                    });
                
                    setCookie(undefined, "tesouroBtAuth.refreshToken", response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30,
                        path: "/"
                    });
    
                    api.defaults.headers['Authorization'] = `Bearer ${token}`

                    failedRequestsQueue.RequestQueue.forEach(request.onSuccess(token))
                    failedRequestsQueue = []
                }).catch(err => {
                    failedRequestsQueue.RequestQueue.forEach(request.onFailure(err))
                    failedRequestsQueue = []
                }).finally(() => isRefreshing =  false);
            }

            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    onSuccess: (token: string) => {
                        originalConfig.headers['Authorization'] = `Bearer ${token}`
                    
                        resolve(api(originalConfig))
                    },
                    onFailure: (err: AxiosError) => {
                        reject(err)
                    }
                })
            })
        } else {
            destroyCookie(undefined, "tesouroBtAuth.token")
            destroyCookie(undefined, "tesouroBtAuth.refreshToken")
        }
    }

    return Promise.reject(error)
})