import { FormEvent, useContext } from "react";
import { IResponse } from "../../../types";
import { fetcher, qS } from "../../helper";
import { UsersFoundContext } from "../../../context/UsersFoundContext";

export function SearchBox() {
    // users found context
    const { setUsersFound } = useContext(UsersFoundContext)

    return (
        <form className="" onSubmit={(event) => searchUsername(event, setUsersFound)}>
            {/* input and submit */}
            <div className="flex justify-between">
                <input type="text" name="username" className="p-1 w-4/5 rounded-s-md text-black focus:outline-none" 
                minLength={3} maxLength={16} placeholder="search username" />
                <button type="submit" className="px-1 w-1/5 rounded-e-md bg-lime-300 dark:bg-pink-600"> Find </button>
            </div>
            {/* message */}
            <div className="font-semibold">
                <p id="search_message" className=""></p>
            </div>
        </form>
    )
}

async function searchUsername(ev: FormEvent<HTMLFormElement>, setUsersFound) {
    ev.preventDefault()

    // access token
    const token = window.localStorage.getItem('accessToken')
    // error message
    const errorMessage = qS('#search_message')
    // form inputs
    // filter button elements
    const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
    // get username input
    const usernameInput = formInputs[0].value
    // search user
    // fetch options
    const searchFetchOptions: RequestInit = {
        method: 'GET',
        headers: {
            'authorization': `Bearer ${token}`
        }
    }
    // fetching
    errorMessage.textContent = 'searching..'
    const searchResponse: IResponse = await (await fetcher(`/user?display_name=${usernameInput}`, searchFetchOptions)).json()
    // response
    switch(searchResponse.status) {
        case 200:
            errorMessage.textContent = ``
            // update access token if exist
            if(searchResponse.data[0]?.token) {
                window.localStorage.setItem('accessToken', searchResponse.data[0].token)
                // delete token array
                searchResponse.data.shift()
            }
            // set users found state
            setUsersFound(searchResponse.data)
            break
        default:
            errorMessage.textContent = `${searchResponse.status}: ${JSON.stringify(searchResponse.message)}`
    }
}