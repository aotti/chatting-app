import { FormEvent } from "react";
import { fetcher, formInputLength, qS, sha256 } from "../../helper";
import { IRegisterPayload, IResponse } from "../../../types";

export default function RegisterPage({pageHandler}: {pageHandler: (page: string) => void}) {
    return (
        <div className="
            mx-auto p-2 border-2 border-black rounded-md bg-green-500 dark:bg-green-600
            lg:w-1/2 ">
            <form className="grid grid-rows-5 gap-4" onSubmit={(event) => registerAccount(event)}>
                {/* display name */}
                <div className="grid grid-cols-2 text-black">
                    <label htmlFor="display_name" className="dark:text-white"> Name </label>
                    <input type="text" id="display_name" minLength={5} maxLength={32} required
                        className="p-1 rounded-md"
                        autoFocus
                        onChange={(event) => formInputLength(event)}/>
                    <span className="col-start-2 text-sm text-left dark:text-white"> 5 ~ 32 characters (letters) </span>
                </div>
                {/* username */}
                <div className="grid grid-cols-2 text-black">
                    <label htmlFor="username" className="dark:text-white"> Username </label>
                    <input type="text" id="username" minLength={5} maxLength={16} required
                        className="p-1 rounded-md"
                        onChange={(event) => formInputLength(event)}/>
                    <span className="col-start-2 text-sm text-left dark:text-white"> 5 ~ 16 characters (letters & numbers) </span>
                </div>
                {/* password */}
                <div className="grid grid-cols-2 text-black">
                    <label htmlFor="password" className="dark:text-white"> Password </label>
                    <input type="password" id="password" minLength={8} required
                        className="p-1 rounded-md"
                        onChange={(event) => formInputLength(event)}/>
                    <span className="col-start-2 text-sm text-left dark:text-white"> min. 8 characters </span>
                </div>
                {/* confirm password */}
                <div className="grid grid-cols-2 text-black">
                    <label htmlFor="confirm_password" className="dark:text-white"> Confirm Password </label>
                    <input type="password" id="confirm_password" minLength={8} required
                        className="p-1 rounded-md"
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
                        onClick={() => pageHandler('home')}> Back </button>
                    <button type="submit" className="text-xl bg-blue-500 rounded-md w-36 p-1 mx-auto shadow-sm shadow-black"> Register </button>
                </div>
            </form>
        </div>
    )
}

async function registerAccount(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault()

    // message container
    const errorMessage = qS('#error_message')
    const successMessage = qS('#success_message')
    // form inputs
    // filter button elements
    const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
    // get form input values
    const formData: IRegisterPayload = {
        display_name: formInputs[0].value,
        username: formInputs[1].value,
        password: sha256(formInputs[2].value),
        confirm_password: sha256(formInputs[3].value)
    }
    // check if display name have any character beside [a-z] and \s
    if(formData.display_name.match(/[^a-z\s]/gi)) {
        return errorMessage.textContent = `any symbol is not allowed! (Name)`
    }
    // check if username have any character beside LETTERS and NUMBERS
    if(formData.username.match(/[^a-z0-9]/gi)) {
        return errorMessage.textContent = `only letters and numbers allowed! (Username)`
    }
    // confirm password
    if(formData.password !== formData.confirm_password) {
        return errorMessage.textContent = `password doesn't match!`
    }
    errorMessage.textContent = ''
    // register account
    // fetch options
    const registerFetchOptions: RequestInit = {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify(formData)
    } 
    // fetching api
    successMessage.textContent = 'loading..'
    const registerResponse: IResponse = await (await fetcher('/user/register', registerFetchOptions)).json()
    successMessage.textContent = ''
    // response api
    switch(registerResponse.status) {
        case 201: 
            successMessage.textContent = 'register success! redirect to home..'
            errorMessage.textContent = ``
            setTimeout(() => {
                (qS('#return_home') as HTMLButtonElement).click()
            }, 2000);
            break
        default: 
            errorMessage.textContent = `${registerResponse.status}: ${registerResponse.message}`
    }
}