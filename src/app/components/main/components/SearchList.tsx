import { Dispatch, SetStateAction, useContext } from "react"
import { IGroupsFound, UsersFoundContext } from "../../../context/UsersFoundContext"
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext"
import { ChatWithContext } from "../../../context/ChatWithContext"
import { IHistoryMessagePayload, IMessage, IResponse } from "../../../types"
import { encryptData } from "../../../api/helper"
import { addMessageItem, fetcher, qS } from "../../helper"
import { MiscContext } from "../../../context/MiscContext"

interface ISearchList {
    crypto: Record<'key'|'iv', string>
}

export default function SearchList({ crypto }: ISearchList) {
    // get page for display
    const { displaySearch } = useContext(MiscContext)

    return displaySearch
        ? <UserList crypto={crypto} />
        : <GroupList crypto={crypto} />
}

function UserList({ crypto }) {
    // get page for display
    const { setDisplayPage, setIsLoading } = useContext(MiscContext)
    // login profile context
    const { isLogin, setShowOtherProfile } = useContext(LoginProfileContext)
    // chat with context
    const { setChatWith, setMessageItems, historyMessageLog, setHistoryMessageLog } = useContext(ChatWithContext)
    const historyChatStates: IHistoryChat = {
        setMessageItems: setMessageItems,
        historyMessageLog: historyMessageLog,
        setHistoryMessageLog: setHistoryMessageLog,
        setIsLoading: setIsLoading
    }
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
                                        // set loading until chat history retrieved
                                        setIsLoading(true)
                                        // open chat box
                                        startChat(isLogin, setChatWith, user, setDisplayPage);
                                        // retrieve chat history
                                        if(isLogin[1]) await historyChat(isLogin[1], user, crypto, historyChatStates);
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

function GroupList({ crypto }) {
    // get page for display
    const { setDisplayPage, setIsLoading } = useContext(MiscContext)
    // login profile context
    const { isLogin, setShowOtherProfile } = useContext(LoginProfileContext)
    // chat with context
    const { setChatWith, setMessageItems, historyMessageLog, setHistoryMessageLog } = useContext(ChatWithContext)
    const historyChatStates: IHistoryChat = {
        setMessageItems: setMessageItems,
        historyMessageLog: historyMessageLog,
        setHistoryMessageLog: setHistoryMessageLog,
        setIsLoading: setIsLoading
    }
    // users found context
    const { groupsFound } = useContext(UsersFoundContext)

    return (
        <div className="border-2 border-black p-2">
            {/* user list header */}
            <div className="grid grid-cols-3">
                {/* name */}
                <span className=" col-span-2"> Group </span>
                {/* chat button */}
                <span className=" text-center"> Action </span>
            </div>
            {/* separator */}
            <hr className="border-2 border-black my-2" />
            {
                // the list
                groupsFound && groupsFound.map((group, i) => {
                    return (
                        <div className="grid grid-cols-3 mb-4 last:mb-0" key={i}>
                            <span className=" col-span-2"> {group.name} </span>
                            <div className="flex justify-around invert">
                                {/* profile button */}
                                <button title="profile" className="invert dark:invert-0" onClick={() => setShowOtherProfile([true, group])}>
                                    <img src="./img/profile.png" alt="profile" width={30} />
                                </button>
                                {/* chat button */}
                                <button title="chat" className="invert dark:invert-0" 
                                    onClick={async () => {
                                        // check if you are member of this group
                                        if(isLogin[1].group.indexOf(group.name) === -1) {
                                            qS('#search_message').textContent = 'you are not member of the group!'
                                            setTimeout(() => { qS('#search_message').textContent = '' }, 3000);
                                            return
                                        }
                                        // set loading until chat history retrieved
                                        setIsLoading(true)
                                        // open chat box
                                        startChat(isLogin, setChatWith, group, setDisplayPage);
                                        // retrieve chat history
                                        if(isLogin[1]) await historyChat(isLogin[1], group, crypto, historyChatStates);
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

// ~~~~~~~ FUNCTIONS ~~~~~~~
// ~~~~~~~ FUNCTIONS ~~~~~~~
function startChat(isLogin, setChatWith, user, setDisplayPage) {
    // get user data to chat with
    setChatWith(user)
    // change page
    setDisplayPage(isLogin[0] ? 'chatting' : 'login')
}

type MessageType<T> = Dispatch<SetStateAction<T>>
interface IHistoryChat {
    setMessageItems: MessageType<IMessage['messages']>;
    historyMessageLog: IMessage[];
    setHistoryMessageLog: MessageType<IMessage[]>;
    setIsLoading: MessageType<boolean>;
}
export async function historyChat(userMe: LoginProfileType, userWith: LoginProfileType | IGroupsFound, crypto: ISearchList['crypto'], historyChatStates: IHistoryChat) {
    const { setMessageItems, historyMessageLog, setHistoryMessageLog, setIsLoading } = historyChatStates
    // set message items to NULL each time open Direct Message
    setMessageItems(null)
    // check new history message to prevent fetching too much to database
    if(historyMessageLog.length > 0) {
        const checkUserHistory = historyMessageLog.map(v => v.user_with).indexOf(`${userWith.id}`)
        // if user message is logged
        if(checkUserHistory !== -1) {
            // end the loading page
            setIsLoading(false)
            // get from message data from history message log, no need to fetch
            return setMessageItems(historyMessageLog[checkUserHistory].messages)
        }
    }
    // access token
    const token = window.localStorage.getItem('accessToken')
    // fetch stuff
    const historyPayload: Partial<IHistoryMessagePayload> = typeof userWith.id == 'number' 
    ? {
        user_with: `${userWith.id}`,
        amount: 100
    }
    : {
        user_me: userMe.id,
        user_with: userWith.id,
        amount: 100
    }
    const encryptedHistoryPayload = await encryptData({text: JSON.stringify(historyPayload), key: crypto.key, iv: crypto.iv})
    const historyFetchOptions: RequestInit = { 
        method: 'GET',
        headers: {
            'authorization': `Bearer ${token}`
        }
    }
    // fetching
    const apiEndpoint = typeof userWith.id == 'number' ? '/chat/group' : '/chat/direct'
    const historyResponse: IResponse = await (await fetcher(`${apiEndpoint}?data=${encryptedHistoryPayload}`, historyFetchOptions)).json()
    // response
    switch(historyResponse.status) {
        case 200: 
            const hisResData = historyResponse.data as IHistoryMessagePayload['message_id'][]
            // loop response data
            for(let hrd of hisResData) {
                const groupMemberIds = typeof userWith.id == 'number' 
                                        ? (userWith as IGroupsFound).member_ids.split(', ')
                                        : null
                const groupMemberNames = typeof userWith.id == 'number' 
                                        ? (userWith as IGroupsFound).member_names.split(', ')
                                        : null
                const getGroupDisplayName = typeof userWith.id == 'number' 
                                        ? groupMemberIds.indexOf(hrd.user_id)
                                        : null
                // get user display name
                const displayName = userMe.id === hrd.user_id 
                                    ? userMe.display_name
                                    : getGroupDisplayName != null && getGroupDisplayName !== -1
                                        ? groupMemberNames[getGroupDisplayName]
                                        : (userWith as LoginProfileType).display_name
                // create message object
                const [date, month, year] = [new Date(hrd.created_at).getDate(), new Date(hrd.created_at).getMonth()+1, new Date(hrd.created_at).getFullYear()]
                const messageDate = `${month}/${date}/${year}`
                const tempMessages: IMessage['messages'][0] = {
                    user: displayName,
                    style: userMe.id === hrd.user_id ? 'justify-end' : 'justify-start',
                    text: hrd.message,
                    is_image: hrd.is_image,
                    time: new Date(hrd.created_at).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'}),
                    date: messageDate,
                    created_at: hrd.created_at
                    // ### updated_at later for edit message
                }
                // set message items for current chat
                setMessageItems(data => data ? [...data, tempMessages] : [tempMessages])
                // push to new history message
                setHistoryMessageLog(data => addMessageItem(data, userMe, userWith, tempMessages))
            }
            // end the loading page
            setIsLoading(false)
            break
        default: 
            console.log(historyResponse)
            break
    }
}
