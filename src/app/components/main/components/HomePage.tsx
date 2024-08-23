import { useContext, useEffect } from "react"
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext"
import { MiscContext } from "../../../context/MiscContext"
import { ChatWithContext } from "../../../context/ChatWithContext"
import { usePubNub } from "pubnub-react";
import { ListenerParameters } from "pubnub";
import { IMessage } from "../../../types";
import { searchGroupname, searchUsername } from "./SearchBox";
import { historyChat } from "./SearchList";
import { UsersFoundContext } from "../../../context/UsersFoundContext";
import LoadingPage from "../../loading";

export default function HomePage({ crypto }) {
    // get page for display & loading
    const { setDisplayPage, isLoading, setIsLoading } = useContext(MiscContext)
    // login state
    const { isLogin } = useContext(LoginProfileContext)
    // check login changes
    useEffect(() => {
        if(isLogin[0]) setIsLoading(false)
    }, [isLogin])

    return (
        isLoading
            ? <LoadingPage />
            : isLogin[0]
                ? <LoginTrue loginData={isLogin[1]} crypto={crypto} />
                : <LoginFalse setDisplayPage={setDisplayPage} /> 
    )
}

function LoginTrue({ loginData, crypto }: {loginData: LoginProfileType; crypto: Record<'key'|'iv', string>}) {
    // display page state
    const { setDisplayPage, setIsLoading } = useContext(MiscContext)
    // islogin state
    const { isLogin } = useContext(LoginProfileContext)
    // chat with & unread message state
    const { setChatWith, setMessageItems, historyMessageLog, setHistoryMessageLog, unreadMessageItems, setUnreadMessageItems } = useContext(ChatWithContext)
    const historyUserChatStates = {
        setMessageItems: setMessageItems,
        historyMessageLog: historyMessageLog,
        setHistoryMessageLog: setHistoryMessageLog,
        setIsLoading: setIsLoading
    }
    // users found context
    const { setUsersFound } = useContext(UsersFoundContext)

    // pubnub
    const pubsub = usePubNub()
    // ONLY FOR UNREAD MESSAGES
    useEffect(() => {
        // subscribe
        const groupChannels = isLogin[1].group.length === 0 ? [] : isLogin[1].group.map(v => `GroupChat-${v}`)
        const dmChannels = [`DirectChat-${isLogin[1].id}`]
        const subsChannels = [...dmChannels, ...groupChannels]
        pubsub.subscribe({ channels: subsChannels })
        // get published message
        const publishedMessage: ListenerParameters =  {
            message: (data) => {
                const newMessage: IMessage['messages'][0] = data.message
                // only get other message
                if(newMessage.user === isLogin[1].display_name) return
                // add the chat to unread messages
                setUnreadMessageItems(data => {
                    const displayName = newMessage.group_name || newMessage.user
                    // data > 0
                    if(data) {
                        const isUserExist = data.map(v => v.display_name).indexOf(displayName)
                        // still have unread message from this user
                        if(isUserExist !== -1) {
                            const newData = [
                                ...data, 
                                {
                                    display_name: displayName, 
                                    type: newMessage?.group_name ? 'group' : 'user',
                                    unread_messages: [...data[isUserExist].unread_messages, newMessage.text]
                                }
                            ]
                            // filter duplicate object
                            const filterNewData = []
                            new Map(newData.map(v => [v['display_name'], v])).forEach(v => filterNewData.push(v))
                            return filterNewData
                        }
                        // no unread message from the user
                        else {
                            const newData = [
                                ...data, 
                                {
                                    display_name: displayName, 
                                    type: newMessage?.group_name ? 'group' : 'user',
                                    unread_messages: [newMessage.text]}
                                ]
                            return newData
                        }
                    }
                    // data still null
                    else {
                        const newData = [{
                            display_name: displayName,
                            type: newMessage?.group_name ? 'group' : 'user',
                            unread_messages: [newMessage.text]
                        }]
                        return newData
                    }
                })
            }
        }
        pubsub.addListener(publishedMessage)
        // unsub and remove listener
        return () => {
            pubsub.unsubscribe({ channels: subsChannels })
            pubsub.removeListener(publishedMessage)
        }
    }, [])

    return (
        <div className="text-center">
            <p className="text-xl"> Welcome {loginData.display_name}! </p>
            {  // if null
            !unreadMessageItems || unreadMessageItems.length === 0
                ? null
                : <>
                    <span className="font-semibold"> Unread Messages! </span>
                    {
                        unreadMessageItems.map((v, i) => {
                            return (
                                <div className="mb-2" key={i}>
                                    <span> {`${v.display_name} - ${v.unread_messages.length} messages`} </span>
                                    <button className="dark:text-lime-300 text-pink-600 font-semibold" onClick={async (ev) => {
                                        // set page to loading
                                        setIsLoading(true)
                                        let getChatWith = null
                                        // find user data
                                        if(v.type == 'user') getChatWith = await searchUsername(ev as any, setUsersFound, setChatWith, v.display_name);
                                        // find group data
                                        else if(v.type == 'group') getChatWith = await searchGroupname(ev as any, setUsersFound, setChatWith, v.display_name);
                                        // get history message
                                        await historyChat(isLogin[1], getChatWith, crypto, historyUserChatStates)
                                        // display chat box
                                        setDisplayPage('chatting');
                                    }}> {'[read]'} </button>
                                </div>
                            )
                        })
                    }
                </>
            }
        </div>
    )
}

function LoginFalse({ setDisplayPage }) {
    return (
        <div className="text-center">
            <p className="text-xl"> Do you already have an account? </p>
            <div className=" mt-2">
                {/* login button */}
                <button className=" bg-green-500 rounded-md p-2 w-20 shadow-sm shadow-black"
                    onClick={() => setDisplayPage('login')}> Login </button>
                {/* separator */}
                <span className=" mx-4"></span>
                {/* register button */}
                <button className=" bg-blue-500 rounded-md p-2 w-20 shadow-sm shadow-black"
                    onClick={() => setDisplayPage('register')}> Register </button>
            </div>
        </div>
    )
}