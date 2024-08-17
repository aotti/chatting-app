import { FormEvent, useContext } from "react"
import { MiscContext } from "../../../context/MiscContext"
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext"
import { fetcher, qS } from "../../helper"
import { randomBytes } from "crypto"
import { IResponse } from "../../../types"

export default function CreateGroup() {
    // get page for display
    const { setDisplayPage } = useContext(MiscContext)
    // login set state
    const { isLogin, setIsLogin } = useContext(LoginProfileContext)

    return (
        <div className="
            mx-auto p-4 border-2 border-black rounded-md bg-blue-500 dark:bg-blue-600 text-center
            lg:w-1/2 ">
            <form className="grid grid-rows-3 gap-4" onSubmit={(event) => createGroup(event, isLogin[1], setIsLogin)}>
                {/* username */}
                <div className="grid grid-cols-2 text-black">
                    <label htmlFor="groupname" className="dark:text-white"> Group Name </label>
                    <input type="text" id="groupname" minLength={5} maxLength={16} required autoFocus
                        className="p-1 rounded-md text-black" />
                    <span className="col-start-2 text-sm text-left dark:text-white"> 5 ~ 16 characters </span>
                </div>
                {/* message */}
                <div className="font-semibold">
                    {/* success */}
                    <p id="success_message" className="text-green-300"></p>
                    {/* error */}
                    <p id="error_message" className="text-red-300"></p>
                </div>
                {/* submit button */}
                <div className="grid grid-cols-2">
                    <button type="button" className="text-xl bg-slate-400 rounded-md w-36 h-fit p-1 mx-auto shadow-sm shadow-black"
                        id="return_home"
                        onClick={() => setDisplayPage('home')}> Back </button>
                    <button type="submit" className="text-xl bg-green-500 rounded-md w-36 h-fit p-1 mx-auto shadow-sm shadow-black"> Create </button>
                </div>
            </form>
        </div>
    )
}

async function createGroup(ev: FormEvent<HTMLFormElement>, userMe: LoginProfileType, setIsLogin) {
    ev.preventDefault()

    try {
        // message container
        const errorMessage = qS('#error_message')
        const successMessage = qS('#success_message')
        // form inputs
        // filter button elements
        const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
        // get form input values
        const formData = {
            // trim all white spaces & replace all multiple whitespace (between 2 words) with single whitespace
            group_name: formInputs[0].value.trim().replace(/ +(?= )/g,''),
            // 1 num = 2 hex code, total length 8 characters
            group_code: randomBytes(4).toString('hex'),
            user_me: userMe.id
        }
        // check if group name have any character beside LETTERS and NUMBERS
        if(formData.group_name.match(/[^a-z0-9\s]/gi)) {
            return errorMessage.textContent = `only letters and numbers allowed!`
        }
        // access token
        const token = window.localStorage.getItem('accessToken')
        // fetch options
        const createGroupFetchOptions: RequestInit = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        }
        // fetching
        successMessage.textContent = 'loading..'
        const createGroupResponse: IResponse = await (await fetcher('/group/create', createGroupFetchOptions)).json()
        console.log(createGroupResponse);
        
        // response api
        switch(createGroupResponse.status) {
            case 200: 
                errorMessage.textContent = ``
                successMessage.textContent = `success create group!
                                            invite code: ${createGroupResponse.data[0].invite_code}`
                // update access token if exist
                if(createGroupResponse.data[0]?.token) {
                    window.localStorage.setItem('accessToken', createGroupResponse.data[0].token)
                    // delete token array
                    delete createGroupResponse.data[0].token
                }
                // add group name to state 
                setIsLogin(data => {
                    data[1].group.push(createGroupResponse.data[0].name)
                    return data
                })
                break
            default: 
                errorMessage.textContent = `${createGroupResponse.status}: ${JSON.stringify(createGroupResponse.message)}`
        }
    } catch (error) {
        console.log(error);
    }
}