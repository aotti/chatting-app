import { Dispatch, FormEvent, SetStateAction, useContext } from "react";
import { fetcher, formInputLength, qS, sha256 } from "../../helper";
import { ILoginPayload, IResponse } from "../../../types";
import { LoginContext, LoginProfileType } from "../../../context/LoginContext";

export default function LoginPage({pageHandler}: {pageHandler: (page: string) => void}) {
    // login set state
    const { setIsLogin } = useContext(LoginContext)

    return (
        <div className="
            mx-auto p-2 border-2 border-black rounded-md
            lg:w-1/2 ">
            <form className="grid grid-rows-3 gap-4" onSubmit={(event) => loginAccount(event, setIsLogin)}>
                {/* username */}
                <div className="grid grid-cols-2">
                    <label htmlFor="username"> Username </label>
                    <input type="text" id="username" minLength={5} maxLength={16} required 
                        className="py-1"
                        onKeyUp={(event) => formInputLength(event)}/>
                </div>
                {/* password */}
                <div className="grid grid-cols-2">
                    <label htmlFor="password"> Password </label>
                    <input type="password" id="password" minLength={8} required 
                        className="py-1"
                        onKeyUp={(event) => formInputLength(event)}/>
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
                    <button type="button" className="text-xl bg-slate-400 border-2 rounded-md w-36 p-1 mx-auto"
                        id="return_home"
                        onClick={() => pageHandler('home')}> Back </button>
                    <button type="submit" className="text-xl bg-green-600 border-2 rounded-md w-36 p-1 mx-auto"> Login </button>
                </div>
            </form>
        </div>
    )
}

async function loginAccount(ev: FormEvent<HTMLFormElement>, setIsLogin: Dispatch<SetStateAction<[boolean, LoginProfileType]>>) {
    ev.preventDefault()

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
            // change home page to welcome
            setIsLogin([true, loginResponse.data[0]]);
            // return to home
            (qS('#return_home') as HTMLButtonElement).click()
            break
        default: 
            errorMessage.textContent = `${loginResponse.status}: ${loginResponse.message}`
    }
}