import { useContext } from "react";
import { LoginProfileContext } from "../../../context/LoginProfileContext";
import { fetcher } from "../../helper";

export default function LogoutButton() {
    const { isLogin, setIsLogin } = useContext(LoginProfileContext)
    return (
        <button className="hover:bg-sky-400 dark:hover:bg-orange-400 w-full p-2" onClick={() => logoutAccount(isLogin, setIsLogin)}> Logout </button>
    )
}

async function logoutAccount(isLogin, setIsLogin) {
    // check is login
    if(!isLogin[0]) return
    // logout account
    // fetch options
    const logoutFetchOptions: RequestInit = {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            id: isLogin[1].id,
            is_login: isLogin[1].is_login
        })
    }
    // fetching
    const logoutResponse = await fetcher('/user/logout', logoutFetchOptions)
    switch(logoutResponse.status) {
        case 204: 
            console.log(logoutResponse);
            
            // set isLogin to false
            setIsLogin([false, null])
            // remove access token
            window.localStorage.removeItem('accessToken')
            break
        default: 
            console.log(logoutResponse.statusText);
    }
}