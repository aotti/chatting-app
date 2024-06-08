import { useContext } from "react";
import { LoginContext } from "../../../context/LoginContext";
import { fetcher } from "../../helper";

export default function LogoutButton() {
    const { isLogin, setIsLogin } = useContext(LoginContext)
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
        body: JSON.stringify(isLogin[1])
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