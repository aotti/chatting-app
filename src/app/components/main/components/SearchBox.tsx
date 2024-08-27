import { FormEvent, useContext, useState } from "react";
import { IResponse } from "../../../types";
import { fetcher, qS } from "../../helper";
import { UsersFoundContext } from "../../../context/UsersFoundContext";
import { MiscContext } from "../../../context/MiscContext";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";

export function SearchBox() {
    // misc
    const { displaySearch, setDisplaySearch } = useContext(MiscContext)
    // users found context
    const { setUsersFound, setGroupsFound } = useContext(UsersFoundContext)
    // spin animation on rotate button
    const [rotateButton, setRotateButton] = useState(false)
    const rotateState = {
        rotateButton: rotateButton,
        setRotateButton: setRotateButton
    }

    // true = user, false = group
    return displaySearch
        ? <SearchUser setUsersFound={setUsersFound} setDisplaySearch={setDisplaySearch} rotateState={rotateState} />
        : <SearchGroup setGroupsFound={setGroupsFound} setDisplaySearch={setDisplaySearch} rotateState={rotateState} />
}

function SearchUser({ setUsersFound, setDisplaySearch, rotateState }) {
    const { rotateButton, setRotateButton } = rotateState
    return (
        <form className="" onSubmit={(event) => searchUsername(event, setUsersFound)}>
            {/* input and submit */}
            <div className="flex justify-between">
                <input type="text" name="username" className="p-1 w-4/5 rounded-s-md text-black focus:outline-none" 
                minLength={3} maxLength={16} placeholder="search username" />
                <button type="submit" className="px-1 w-1/5 rounded-e-md bg-lime-300 dark:bg-pink-600"> Find </button>
                <button type="button" className={`ml-2 w-fit rounded-md invert-0 dark:invert ${rotateButton ? 'animate-spin' : ''}`} 
                    onClick={() => {
                        setDisplaySearch(b => !b) 
                        setRotateButton(b => !b)
                        setTimeout(() => setRotateButton(b => !b), 500);
                    }}>
                    <img src="https://img.icons8.com/?size=100&id=14296&format=png" alt="🔁" className="w-8" />
                </button>
            </div>
            {/* message */}
            <div className="font-semibold">
                <p id="search_message" className=""></p>
            </div>
        </form>
    )
}

function SearchGroup({ setGroupsFound, setDisplaySearch, rotateState }) {
    const { rotateButton, setRotateButton } = rotateState
    const { isLogin, setIsLogin } = useContext(LoginProfileContext)
    const { setDisplayPage } = useContext(MiscContext)

    return (
        <>
            <form className="" onSubmit={(event) => searchGroupname(event, setGroupsFound)}>
                {/* input and submit */}
                <div className="flex justify-between">
                    <input type="text" name="username" className="p-1 w-4/5 rounded-s-md text-black focus:outline-none" 
                    minLength={3} maxLength={16} placeholder="search group name" />
                    <button type="submit" className="px-1 w-1/5 rounded-e-md bg-lime-300 dark:bg-pink-600"> Find </button>
                    <button type="button" className={`ml-2 w-fit rounded-md invert-0 dark:invert ${rotateButton ? 'animate-spin' : ''}`} 
                        onClick={() => {
                            setDisplaySearch(b => !b) 
                            setRotateButton(b => !b)
                            setTimeout(() => setRotateButton(b => !b), 500);
                        }}>
                        <img src="https://img.icons8.com/?size=100&id=14296&format=png" alt="🔁" className="w-8" loading="lazy" />
                    </button>
                </div>
            </form>
            <form className="" onSubmit={(event) => joinGroup(event, isLogin[1], setIsLogin)}>
                {/* group buttons */}
                <div className="flex justify-between my-2">
                    <input type="text" name="inviteCode" className="p-1 w-4/5 rounded-s-md text-black focus:outline-none" 
                    minLength={8} maxLength={8} placeholder="group invite code" />
                    <button type="submit" className="px-1 w-1/5 rounded-e-md bg-lime-300 dark:bg-pink-600"> Join </button>
                    <button type="button" className="ml-2 w-fit rounded-md invert-0 dark:invert" title="create group"
                        onClick={() => { if(isLogin[0]) setDisplayPage('create group') }}> 
                        <img src="https://img.icons8.com/?size=100&id=9499&format=png" alt="🔁" className="w-8" loading="lazy" />
                    </button>
                </div>
                {/* message */}
                <div className="font-semibold">
                    <p id="search_message" className=""></p>
                </div>
            </form>
        </>
    )
}

export async function searchUsername(ev: FormEvent<HTMLFormElement>, setUsersFound, setChatWith = null, username = null) {
    ev.preventDefault()

    try {
        // access token
        const token = window.localStorage.getItem('accessToken')
        // error message
        const searchMessage = qS('#search_message')
        // form inputs
        // filter button elements
        const formInputs = username ? [{value: username}] : ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
        // get username input
        const usernameInput = formInputs[0].value
        // search user
        // fetch options
        const searchFetchOptions: RequestInit = !token ? { method: 'GET' } : {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${token}`
            }
        }
        // fetching
        searchMessage.textContent = 'searching..'
        const searchResponse: IResponse = await (await fetcher(`/user?display_name=${usernameInput}`, searchFetchOptions)).json()
        // response
        switch(searchResponse.status) {
            case 200:
                searchMessage.textContent = ``
                // update access token if exist
                if(searchResponse.data[0]?.token) {
                    window.localStorage.setItem('accessToken', searchResponse.data[0].token)
                    // delete token array
                    delete searchResponse.data[0].token
                }
                // get chat with (open unread message)
                if(username) {
                    setChatWith(searchResponse.data[0])
                    return searchResponse.data[0]
                }
                // set users found state
                setUsersFound(searchResponse.data)
                break
            default:
                searchMessage.textContent = `${searchResponse.status}: ${JSON.stringify(searchResponse.message)}`
        }
    } catch (error) {
        console.log(error);
    }
}

export async function searchGroupname(ev: FormEvent<HTMLFormElement>, setGroupsFound, setChatWith = null, groupname = null) {
    ev.preventDefault()

    try {
        // access token
        const token = window.localStorage.getItem('accessToken')
        // error message
        const searchMessage = qS('#search_message')
        // form inputs
        // filter button elements
        const formInputs = groupname ? [{value: groupname}] : ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
        // get groupname input
        const groupnameInput = formInputs[0].value
        // search user
        // fetch options
        const searchFetchOptions: RequestInit = !token ? { method: 'GET' } : {
            method: 'GET',
            headers: {
                'authorization': `Bearer ${token}`
            }
        }
        // fetching
        searchMessage.textContent = 'searching..'
        const searchResponse: IResponse = await (await fetcher(`/group?group_name=${groupnameInput}`, searchFetchOptions)).json()
        // response
        switch(searchResponse.status) {
            case 200:
                searchMessage.textContent = ``
                // update access token if exist
                if(searchResponse.data[0]?.token) {
                    window.localStorage.setItem('accessToken', searchResponse.data[0].token)
                    // delete token array
                    delete searchResponse.data[0].token
                }
                // get chat with (open unread message)
                if(groupname) {
                    setChatWith(searchResponse.data[0])
                    return searchResponse.data[0]
                }
                // set users found state
                setGroupsFound(searchResponse.data)
                break
            default:
                searchMessage.textContent = `${searchResponse.status}: ${JSON.stringify(searchResponse.message)}`
        }
    } catch (error) {
        console.log(error);
    }
}

async function joinGroup(ev: FormEvent<HTMLFormElement>, userMe: LoginProfileType, setIsLogin) {
    ev.preventDefault()

    try {
        // if user data == null, STOP
        if(!userMe?.id) return
        // access token
        const token = window.localStorage.getItem('accessToken')
        // token null, STOP
        if(!token) return
        // error message
        const searchMessage = qS('#search_message')
        // form inputs
        // filter button elements
        const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
        // get invite code input
        const inviteCodeInput = formInputs[0].value
        // search user
        // fetch options
        const joinFetchOptions: RequestInit = {
            method: 'POST',
            headers: {
                'content-type': 'application/json',
                'authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                group_code: inviteCodeInput,
                user_me: userMe.id // user id
            })
        }
        // fetching
        searchMessage.textContent = 'joining..'
        const joinResponse: IResponse = await (await fetcher(`/group/join`, joinFetchOptions)).json()
        console.log(joinResponse);
        
        // response
        switch(joinResponse.status) {
            case 200:
                searchMessage.textContent = `success joining "${joinResponse.data[0].name}" group!`
                setTimeout(() => { searchMessage.textContent = `` }, 3000);
                // update access token if exist
                if(joinResponse.data[0]?.token) {
                    window.localStorage.setItem('accessToken', joinResponse.data[0].token)
                    // delete token array
                    delete joinResponse.data[0].token
                }
                // add group name to state 
                setIsLogin(data => {
                    data[1].group.push(joinResponse.data[0].name)
                    return data
                })
                break
            default:
                // check db error P0001 (function error)
                const resErrorMessage = joinResponse.message as any
                if(resErrorMessage.code == 'P0001') {
                    searchMessage.textContent = `${resErrorMessage.code}: ${resErrorMessage.message}`
                    break
                }
                searchMessage.textContent = `${joinResponse.status}: ${JSON.stringify(joinResponse.message)}`
        }
    } catch (error) {
        console.log(error);
    }
}