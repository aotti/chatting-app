import { useContext } from "react";
import { LoginProfileContext } from "../../../context/LoginProfileContext";
import { fetcher } from "../../helper";
import { ChatWithContext } from "../../../context/ChatWithContext";

export default function LogoutButton() {
    // islogin state
    const { isLogin, setIsLogin } = useContext(LoginProfileContext)
    // history message state
    const { setHistoryMessageLog } = useContext(ChatWithContext)
    return (
        <button className="hover:bg-sky-400 dark:hover:bg-orange-400 w-full p-2" 
            onClick={() => logoutAccount(isLogin, setIsLogin, setHistoryMessageLog)}> Logout </button>
    )
}

async function logoutAccount(isLogin, setIsLogin, setHistoryMessageLog) {
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
            id: isLogin[1].id
        })
    }
    // fetching
    const logoutResponse = await fetcher('/user/logout', logoutFetchOptions)
    switch(logoutResponse.status) {
        case 204: 
            console.log(logoutResponse);
            
            // set isLogin to false
            setIsLogin([false, null])
            // set history message to empty
            setHistoryMessageLog([])
            // remove access token
            window.localStorage.removeItem('accessToken')
            window.localStorage.removeItem('lastAccess')
            break
        default: 
            console.log(logoutResponse.statusText);
    }
}