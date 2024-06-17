import { Dispatch, FormEvent, SetStateAction, useContext, useEffect, useState } from "react";
import { ChatWithContext } from "../../../context/ChatWithContext";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";
import { IDirectChatPayload, IMessage, IResponse } from "../../../types";
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
    // get message
    const [getMessageCounter, setGetMessageCounter] = useState(false)
    const [getMessage, setGetMessage] = useState<IMessage[]>([])
    // send message
    const [sendMessage, setSendMessage] = useState<Omit<IDirectChatPayload, 'user_to'>>(null)
    // message items
    const [messageItems, setMessageItems] = useState<IMessage[]>([
        { style: 'justify-end', author: isLogin[1].display_name, text: 'message 1' },
        { style: 'justify-start', author: 'yanto', text: 'message 2' }
    ])

    // pubnub
    const pubsub = usePubNub()
    useEffect(() => {
        // scroll to bottom
        const messageContainer = qS('#messageContainer')
        messageContainer.scrollTo({top: messageContainer.scrollHeight})
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
                    <p> {chatWith.is_login ? 'Online' : 'Offline'} </p>
                </div>
            </div>
            {/* chat box */}
            <div className="flex items-end row-span-6 border-b border-t">
                <Messages messageItems={messageItems} />
            </div>
            {/* send message box */}
            <div className="flex items-center border-t border-black">
                <form className="flex justify-around w-full" onSubmit={(event) => sendChat(event, setMessageItems, isLogin[1], chatWith)}>
                    <input type="text" className="text-xl p-1 w-4/5 rounded-md dark:text-black" 
                        id="messageBox" 
                        onKeyUp={() => setGetMessageCounter(false)}/>
                    <button type="submit" className="inline-block bg-orange-400 dark:bg-orange-600 py-1 px-2 w-24 rounded-md"> 
                        Send 
                    </button>
                </form>
            </div>
        </div>
    )
}

function Messages({ messageItems }: { messageItems: any[] }) {
    return (
        // message container
        <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll">
            {
                // message items
                messageItems.map((v, i) => {
                    return <MessageItem style={v.style} author={v.author} message={v.text} key={i}/>
                })
            }
        </div>
    )
}

function MessageItem({style, author, message}: Record<'style'|'author'|'message', string>) {
    return (
        <div className={`flex ${style}`}>
            <div className="border rounded-md min-w-32 p-1 my-2 bg-orange-400 dark:bg-sky-700">
                {/* author & status*/}
                <p className="text-xs flex justify-between"> 
                    <span> {author} </span>
                    <span id="messageStatus"> {style.includes('start') ? '✔' : '🕗'} </span>
                </p>
                {/* message */}
                <p className="text-left"> {message} </p>
                {/* time */}
                <p className="text-right text-xs border-t"> {new Date().toLocaleTimeString()} </p>
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
    const formData = {
        user_from: userFrom.id,
        user_to: userTo.id,
        message: JSON.stringify(formInputs[0].value)
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
            text: JSON.parse(formData.message) 
        }
    ])
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
    const messageBox = qS('#messageBox') as HTMLInputElement
    const messageStatus = qSA('#messageStatus')
    
    // response
    switch(messageFetch.status) {
        case 200: 
            // empty message input
            messageBox.value = ''
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