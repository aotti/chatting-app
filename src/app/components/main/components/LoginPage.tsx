import { FormEvent, useContext } from "react";
import { fetcher, formInputLength, modifyUnreadMessages, qS, sha256 } from "../../helper";
import { ILoginPayload, IResponse } from "../../../types";
import { LoginProfileContext } from "../../../context/LoginProfileContext";
import { DarkModeContext } from "../../../context/DarkModeContext";
import { ChatWithContext } from "../../../context/ChatWithContext";

export default function LoginPage() {
    // get page for display
    const { setDisplayPage } = useContext(DarkModeContext)
    // login set state
    const { setIsLogin } = useContext(LoginProfileContext)
    // unread message state
    const { setUnreadMessageItems } = useContext(ChatWithContext)

    return (
        <div className="
            mx-auto p-2 border-2 border-black rounded-md bg-blue-500 dark:bg-blue-600
            lg:w-1/2 ">
            <form className="grid grid-rows-3 gap-4" onSubmit={(event) => loginAccount(event, setIsLogin, setUnreadMessageItems)}>
                {/* username */}
                <div className="grid grid-cols-2 text-black">
                    <label htmlFor="username" className="dark:text-white"> Username </label>
                    <input type="text" id="username" minLength={5} maxLength={16} required 
                        className="p-1 rounded-md text-black"
                        autoFocus
                        onChange={(event) => formInputLength(event)}/>
                    <span className="col-start-2 text-sm text-left dark:text-white"> 5 ~ 16 characters </span>
                </div>
                {/* password */}
                <div className="grid grid-cols-2 text-black">
                    <label htmlFor="password" className="dark:text-white"> Password </label>
                    <input type="password" id="password" minLength={8} required 
                        className="p-1 rounded-md text-black"
                        onChange={(event) => formInputLength(event)}/>
                    <span className="col-start-2 text-sm text-left dark:text-white"> min. 8 characters </span>
                </div>
                {/* message */}
                <div className="font-semibold">
                    {/* success */}
                    <p id="success_message" className="text-green-400"></p>
                    {/* error */}
                    <p id="error_message" className="text-red-400"></p>
                </div>
                {/* submit button */}
                <div className="grid grid-cols-2">
                    <button type="button" className="text-xl bg-slate-400 rounded-md w-36 p-1 mx-auto shadow-sm shadow-black"
                        id="return_home"
                        onClick={() => setDisplayPage('home')}> Back </button>
                    <button type="submit" className="text-xl bg-green-500 rounded-md w-36 p-1 mx-auto shadow-sm shadow-black"> Login </button>
                </div>
            </form>
        </div>
    )
}

async function loginAccount(ev: FormEvent<HTMLFormElement>, setIsLogin, setUnreadMessageItems) {
    ev.preventDefault()

    try {
        // message container
        const errorMessage = qS('#error_message')
        const successMessage = qS('#success_message')
        // form inputs
        // filter button elements
        const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
        // get form input values
        const formData: ILoginPayload = {
            username: formInputs[0].value,
            password: sha256(formInputs[1].value)
        }
        // check if username have any character beside LETTERS and NUMBERS
        if(formData.username.match(/[^a-z0-9]/gi)) {
            return errorMessage.textContent = `only letters and numbers allowed! (Username)`
        }
        // login account
        // fetch options
        const loginFetchOptions: RequestInit = {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(formData)
        }
        // fetching
        successMessage.textContent = 'loading..'
        const loginResponse: IResponse = await (await fetcher(`/user/login`, loginFetchOptions)).json()
        successMessage.textContent = ''
        // response api
        switch(loginResponse.status) {
            case 200: 
                console.log(loginResponse);
                
                successMessage.textContent = 'login success!'
                errorMessage.textContent = ``
                // save token to local storage
                window.localStorage.setItem('accessToken', loginResponse.data[0].token)
                // update user last access on client 
                window.localStorage.setItem('lastAccess', new Date().toISOString())
                // delete token before send to variable
                delete loginResponse.data[0].token
                // get unread messages
                setUnreadMessageItems(modifyUnreadMessages(loginResponse))
                delete loginResponse.data[0].unread_messages
                // change home page to welcome
                setIsLogin([true, loginResponse.data[0]]);
                // return to home
                (qS('#return_home') as HTMLButtonElement).click()
                break
            default: 
                errorMessage.textContent = `${loginResponse.status}: ${loginResponse.message}`
        }
    } catch (error) {
        console.log(error);
        
    }
}