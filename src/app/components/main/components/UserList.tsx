import { Dispatch, SetStateAction, useContext, useState } from "react"
import { UsersFoundContext } from "../../../context/UsersFoundContext"
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext"
import { ChatWithContext } from "../../../context/ChatWithContext"
import { IHistoryMessagePayload, IMessage, IResponse } from "../../../types"
import { encryptData } from "../../../api/helper"
import { addMessageItem, fetcher } from "../../helper"

interface IUserList {
    pageHandler: (page: string) => void;
    crypto: {
        key: string;
        iv: string;
    };
}

export default function UserList({pageHandler, crypto}: IUserList) {
    // login profile context
    const { isLogin, setShowOtherProfile } = useContext(LoginProfileContext)
    // chat with context
    const { setChatWith, setMessageItems, historyMessageLog, setHistoryMessageLog } = useContext(ChatWithContext)
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
                                        await historyChat(isLogin[1], user, crypto, setMessageItems, historyMessageLog, setHistoryMessageLog);
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

type MessageType<T> = Dispatch<SetStateAction<T>>
async function historyChat(userMe: LoginProfileType, userWith: LoginProfileType, crypto: IUserList['crypto'], setMessageItems: MessageType<IMessage['messages']>, historyMessageLog: IMessage[], setHistoryMessageLog: MessageType<IMessage[]>) {
    // set message items to NULL each time open Direct Message
    setMessageItems(null)
    // check new history message to prevent fetching too much to database
    if(historyMessageLog.length > 0) {
        const checkUserHistory = historyMessageLog.map(v => v.user_with).indexOf(userWith.id)
        if(checkUserHistory !== -1) {
            return setMessageItems(historyMessageLog[checkUserHistory].messages)
        }
    }
    // fetch stuff
    const historyPayload: IHistoryMessagePayload = {
        user_me: userMe.id,
        user_with: userWith.id,
        amount: 100
    }
    const encryptedHistoryPayload = await encryptData({text: JSON.stringify(historyPayload), key: crypto.key, iv: crypto.iv})
    const historyFetchOptions: RequestInit = { method: 'GET' }
    // fetching
    const historyResponse: IResponse = await (await fetcher(`/chat/direct?data=${encryptedHistoryPayload}`, historyFetchOptions)).json()
    // response
    switch(historyResponse.status) {
        case 200: 
            // ### TAMPILKAN HISTORY MESSAGE LANGSUNG
            // ### KE MESSAGE COMPONENT DARIPADA 
            // ### DIKIRIM KE MESSAGE ITEMS DULU 
            const hisResData = historyResponse.data as IHistoryMessagePayload['message_id'][]
            // ### BUAT LOOP hisResData LALU PAKAI FUNCTION addMessageItem
            for(let hrd of hisResData) {
                // create message object
                const tempMessages: IMessage['messages'][0] = {
                    user: userMe.id === hrd.user_id ? userMe.display_name : userWith.display_name,
                    style: userMe.id === hrd.user_id ? 'justify-end' : 'justify-start',
                    text: hrd.message,
                    time: new Date(hrd.created_at).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'}),
                    date: new Date(hrd.created_at).toLocaleDateString([], {day: '2-digit', month: '2-digit', year: 'numeric'}),
                    created_at: hrd.created_at
                    // ### updated_at later
                }
                setMessageItems(data => data ? [...data, tempMessages] : [tempMessages])
                // push to new history message
                setHistoryMessageLog(data => addMessageItem(data, userMe, userWith, tempMessages))
            }
            console.log(historyResponse.data);
            
            break
        default: 
            console.log(historyResponse)
            break
    }
}