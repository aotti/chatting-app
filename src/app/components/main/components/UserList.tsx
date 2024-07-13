import { useContext, useState } from "react"
import { UsersFoundContext } from "../../../context/UsersFoundContext"
import { LoginProfileContext } from "../../../context/LoginProfileContext"
import { ChatWithContext } from "../../../context/ChatWithContext"
import { IHistoryMessagePayload, IResponse } from "../../../types"
import { encryptData } from "../../../api/helper"
import { fetcher } from "../../helper"

interface IUserList {
    pageHandler: (page: string) => void;
    crypto: {
        key: string;
        iv: string;
    };
}

// history message log
const historyMessageLog = []

export default function UserList({pageHandler, crypto}: IUserList) {
    // login profile context
    const { isLogin, setShowOtherProfile } = useContext(LoginProfileContext)
    // chat with context
    const { setChatWith, setHistoryMessages } = useContext(ChatWithContext)
    // users found context
    const { usersFound } = useContext(UsersFoundContext)

    return (
        <div className="border-2 border-black p-2">
            {/* user list header */}
            <div className="grid grid-cols-3">
                {/* name */}
                <span className=" col-span-2"> User </span>
                {/* chat button */}
                <span className=" text-center"> Action </span>
            </div>
            {/* separator */}
            <hr className="border-2 border-black my-2" />
            {
                // the list
                usersFound && usersFound.map((user, i) => {
                    return (
                        <div className="grid grid-cols-3 mb-4 last:mb-0" key={i}>
                            <span className=" col-span-2"> {user.display_name} </span>
                            <div className="flex justify-around invert">
                                {/* profile button */}
                                <button title="profile" className="invert dark:invert-0" onClick={() => setShowOtherProfile([true, user])}>
                                    <img src="./img/profile.png" alt="profile" width={30} />
                                </button>
                                {/* chat button */}
                                <button title="chat" className="invert dark:invert-0" 
                                    onClick={async () => {
                                        startChat(isLogin, setChatWith, user, pageHandler);
                                        if(historyMessageLog.indexOf(user.id) === -1) {
                                            await historyChat(isLogin[1].id, user.id, crypto, setHistoryMessages);
                                            historyMessageLog.push(user.id)
                                        }
                                    }}>
                                    <img src="./img/send.png" alt="chat" width={30} />
                                </button>
                            </div>
                        </div>
                    )
                })
            }
        </div>
    )
}

function startChat(isLogin, setChatWith, user, pageHandler) {
    // get user data to chat with
    setChatWith(user)
    // change page
    pageHandler(isLogin[0] ? 'chatting' : 'login')
}

async function historyChat(userMe: string, userWith: string, crypto: IUserList['crypto'], setHistoryMessages) {
    // fetch stuff
    const historyPayload: IHistoryMessagePayload = {
        user_me: userMe,
        user_with: userWith,
        amount: 100
    }
    const encryptedHistoryPayload = await encryptData({text: JSON.stringify(historyPayload), key: crypto.key, iv: crypto.iv})
    const historyFetchOptions: RequestInit = { method: 'GET' }
    // fetching
    const historyResponse: IResponse = await (await fetcher(`/chat/direct?data=${encryptedHistoryPayload}`, historyFetchOptions)).json()
    // response
    switch(historyResponse.status) {
        case 200: 
            setHistoryMessages((data: IHistoryMessagePayload[]) => {
                if(data) {
                    const oldData = [...data, ...historyResponse.data]
                    const newData = []
                    // filter data by created_at
                    new Map(oldData.map(v => [v['created_at'], v])).forEach(v => newData.push(v))
                    // return new data
                    return newData
                }
                else return historyResponse.data
            })
            console.log(historyResponse.data);
            
            break
        default: 
            console.log(historyResponse)
            break
    }
}