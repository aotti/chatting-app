import { Dispatch, FormEvent, SetStateAction, useContext, useEffect, useState } from "react";
import { ChatWithContext } from "../../../context/ChatWithContext";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";
import { IMessage, IResponse } from "../../../types";
import { fetcher, qS, qSA } from "../../helper";
import { usePubNub } from "pubnub-react";
import { ListenerParameters } from "pubnub";

export default function ChattingPage() {
    // chat with context
    const { chatWith } = useContext(ChatWithContext)
    // login profile context
    const { isLogin } = useContext(LoginProfileContext)
    // history messages
    const [historyMessages, setHistoryMessages] = useState(null)
    // message items
    const [messageItems, setMessageItems] = useState<IMessage[]>(() => {
        const messageTime = new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'})
        return [
            // tambah date time
            { style: 'justify-end', author: isLogin[1].display_name, text: 'message 1', time: messageTime },
            { style: 'justify-start', author: 'yanto', text: 'message 2', time: messageTime }
        ]
    })
    /*
    buat variable static untuk simpan tiap user yg login
    jika user login, push ke variable
    jika user afk lebih dari 5 menit, anggap OFFLINE
    jika user logout, anggap OFFLINE
    selain itu anggap ONLINE
     */
    // public static onlineUsers: Pick<LoginProfileType, 'id'|'display_name'>[] = []

    // pubnub
    const pubsub = usePubNub()
    useEffect(() => {
        // subscribe
        const dmChannel = `DirectChat-${isLogin[1].id}`
        pubsub.subscribe({ channels: [dmChannel] })
        // get published message
        const publishedMessage: ListenerParameters =  {
            message: (data) => {
                const newMessage: IMessage = data.message
                // only get other message
                if(newMessage.author === isLogin[1].id) return
                // make sure the author of message
                if(newMessage.author !== chatWith.id) return
                // add message
                newMessage.style = 'justify-start'
                newMessage.author = chatWith.display_name
                setMessageItems(oldMessages => [...oldMessages, newMessage])
            }
        }
        pubsub.addListener(publishedMessage)
        // unsub and remove listener
        return () => {
            pubsub.unsubscribe({ channels: ['chatting-app'] })
            pubsub.removeListener(publishedMessage)
        }
    }, [])

    // message items
    useEffect(() => {
        // scroll to bottom
        const messageContainer = qS('#messageContainer')
        messageContainer.scrollTo({top: messageContainer.scrollHeight})
    }, [messageItems])

    return (
        <div className="grid grid-rows-8 h-full p-2">
            {/* user */}
            <div className="flex justify-center gap-4 p-2">
                <div className="rounded-full border w-20 md:w-16 ">
                    <img src="" alt="pfp"/>
                </div>
                <div className="">
                    <p> {chatWith.display_name} </p>
                    <p> {chatWith.is_login} </p>
                </div>
            </div>
            {/* chat box */}
            <div className="flex items-end row-span-6 border-b border-t">
                <Messages messageItems={messageItems} />
            </div>
            {/* send message box */}
            <div className="flex items-center border-t border-black">
                <form className="flex justify-around w-full" onSubmit={(event) => sendChat(event, setMessageItems, isLogin[1], chatWith)}>
                    <input type="text" className="text-xl p-1 w-4/5 rounded-md dark:text-black" id="messageBox" />
                    <button type="submit" className="inline-block bg-orange-400 dark:bg-orange-600 py-1 px-2 w-24 rounded-md"> 
                        Send 
                    </button>
                </form>
            </div>
        </div>
    )
}

function Messages({ messageItems }: { messageItems: IMessage[] }) {
    return (
        // message container
        <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll">
            {
                // message items
                messageItems.map((v, i) => {
                    return <MessageItem msgItem={v} key={i}/>
                })
            }
        </div>
    )
}

function MessageItem({msgItem}: {msgItem: IMessage}) {
    return (
        <div className={`flex ${msgItem.style}`}>
            <div className="border rounded-md min-w-32 p-1 my-2 bg-orange-400 dark:bg-sky-700">
                {/* author & status*/}
                <p className="text-xs flex justify-between"> 
                    <span> {msgItem.author} </span>
                    <span id="messageStatus" className="brightness-150"> {msgItem.style.includes('start') ? '✔' : '🕗'} </span>
                </p>
                {/* message */}
                <p className="text-left"> {msgItem.text} </p>
                {/* time */}
                <p className="text-right text-xs border-t"> {msgItem.time} </p>
            </div>
        </div>
    )
}

async function sendChat(ev: FormEvent<HTMLFormElement>, setMessageItems: Dispatch<SetStateAction<IMessage[]>>, userFrom: LoginProfileType, userTo: LoginProfileType) {
    ev.preventDefault()
    // access token
    const token = window.localStorage.getItem('accessToken')
    // form inputs
    // filter button elements
    const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
    // message payload
    const messageTime = new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'})
    const formData = {
        user_from: userFrom.id,
        user_to: userTo.id,
        message: JSON.stringify(formInputs[0].value),
        time: messageTime
    }
    // check message empty
    if(formData.message == '') return
    // append new message
    setMessageItems(oldMessages => [
        ...oldMessages, 
        { 
            // my new message
            style: 'justify-end', 
            author: userFrom.display_name, 
            text: JSON.parse(formData.message),
            time: messageTime
        }
    ])
    // empty message input
    const messageBox = qS('#messageBox') as HTMLInputElement
    messageBox.value = ''
    // send message
    // fetch options
    const messageFetchOptions: RequestInit = {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
    }
    // fetching
    const messageFetch: IResponse = await (await fetcher('/chat/direct', messageFetchOptions)).json()
    console.log(messageFetch);
    // message elements
    const messageStatus = qSA('#messageStatus')
    
    // response
    switch(messageFetch.status) {
        case 200: 
            // change message status
            messageStatus[messageStatus.length-1].textContent = '✔'
            // check new access token
            if(messageFetch.data[0].token) {
                // save token to local storage
                window.localStorage.setItem('accessToken', messageFetch.data[0].token)
                // delete token 
                delete messageFetch.data[0].token
            }
            break
        default: 
            messageStatus[messageStatus.length-1].textContent = '⚠'
    }
}