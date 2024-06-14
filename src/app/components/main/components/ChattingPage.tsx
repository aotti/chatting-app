import { FormEvent, useContext, useState } from "react";
import { ChatWithContext } from "../../../context/ChatWithContext";
import { LoginProfileContext } from "../../../context/LoginProfileContext";
import { startPubnub } from "../../../../lib/PubNub";
import { IDirectChatPayload, IResponse } from "../../../types";
import { fetcher, qS } from "../../helper";

export default function ChattingPage({ pubnubKeys }: { pubnubKeys: {sub: string; pub: string}}) {
    // chat with context
    const { chatWith } = useContext(ChatWithContext)
    // login profile context
    const { isLogin } = useContext(LoginProfileContext)
    // history messages
    const [historyMessages, setHistoryMessages] = useState(null)
    // get message
    const [getMessage, setGetMessage] = useState<IDirectChatPayload[]>(null)
    // send message
    const [sendMessage, setSendMessage] = useState<Omit<IDirectChatPayload, 'user_to'>>(null)
    // pubnub 
    const pubsub = isLogin[0] ? startPubnub(pubnubKeys.sub, pubnubKeys.pub, isLogin[1].id) : null
    // subscribe
    pubsub.subscribe({ channels: ['chatting-app'] })
    pubsub.addListener({
        message: (msg) => {
            const getMessage = msg.message
            console.log(getMessage);
            
        }
    })

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
                <Messages />
            </div>
            {/* send message box */}
            <div className="flex items-center border-t border-black">
                <form className="flex justify-around w-full" onSubmit={(event) => sendChat(event, isLogin[1].id, chatWith.id)}>
                    <input type="text" className="text-xl p-1 w-4/5 rounded-md dark:text-black" id="messageBox" />
                    <button type="submit" className="inline-block bg-orange-400 dark:bg-orange-600 py-1 px-2 w-24 rounded-md"> 
                        Send 
                    </button>
                </form>
            </div>
        </div>
    )
}

function Messages() {
    return (
        // message container
        <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll">
            {/* message item */}
            <MessageItem style={'justify-end'} author={'wawan'} message={'message 1'} />
            <MessageItem style={'justify-start'} author={'yanto'} message={'message 2'} />
        </div>
    )
}

function MessageItem({style, author, message}) {
    return (
        <div className={`flex ${style}`}>
            <div className="border rounded-md w-fit p-1 my-2">
                {/* author */}
                <p className="text-left text-xs"> {author} </p>
                {/* message */}
                <p className=""> {message} </p>
            </div>
        </div>
    )
}

async function sendChat(ev: FormEvent<HTMLFormElement>, userFrom: string, userTo: string) {
    ev.preventDefault()
    // access token
    const token = window.localStorage.getItem('accessToken')
    // form inputs
    const messageBox = qS('#messageBox') as HTMLInputElement
    // filter button elements
    const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
    // message payload
    const formData = {
        user_from: userFrom,
        user_to: userTo,
        message: JSON.stringify(formInputs[0].value)
    }
    // check message empty
    if(formData.message == '') return
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
    
    // response
    switch(messageFetch.status) {
        case 200: 
            messageBox.value = ''
            break
        default: 
    }
}