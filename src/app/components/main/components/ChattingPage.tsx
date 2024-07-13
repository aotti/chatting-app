import { Dispatch, FormEvent, SetStateAction, useContext, useEffect, useState } from "react";
import { ChatWithContext } from "../../../context/ChatWithContext";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";
import { IDirectChatPayload, IMessage, IResponse } from "../../../types";
import { fetcher, qS, qSA } from "../../helper";
import { usePubNub } from "pubnub-react";
import { ListenerParameters } from "pubnub";

export default function ChattingPage() {
    // chat with context
    const { chatWith, historyMessages } = useContext(ChatWithContext)
    // login profile context
    const { isLogin } = useContext(LoginProfileContext)
    // message items
    // ### UBAH TYPE messageItems MENJADI
    // ### STYLE, AUTHOR, TARGET, TEXT, DATE, TIME
    const [messageItems, setMessageItems] = useState<IMessage[]>([])

    // get history chat
    useEffect(() => {
        // ### LAKUKAN CEK JIKA USER SUDAH PERNAH DI AMBIL HISTORY MESSAGE NYA
        // ### JADI TIDAK SELALU KONEKSI KE DATABASE
        console.log({historyMessages});
        if(historyMessages) {
            // loop messages
            for(let hm of historyMessages) {
                // check my messages
                const tempMessages: IMessage['messages'][0] = {
                    user: isLogin[1].id === hm.user_id ? isLogin[1].display_name : chatWith.display_name,
                    style: isLogin[1].id === hm.user_id ? 'justify-end' : 'justify-start',
                    text: hm.message,
                    time: new Date(hm.created_at).toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'}),
                    date: new Date(hm.created_at).toLocaleDateString([], {day: '2-digit', month: '2-digit', year: 'numeric'})
                }
                setMessageItems(data => addMessageItem(data, isLogin[1], chatWith, tempMessages))
            }
        }
    }, [historyMessages])

    // pubnub
    const pubsub = usePubNub()
    useEffect(() => {
        // subscribe
        const dmChannel = `DirectChat-${isLogin[1].id}`
        pubsub.subscribe({ channels: [dmChannel] })
        // get published message
        const publishedMessage: ListenerParameters =  {
            message: (data) => {
                const newMessage: IMessage['messages'][0] = data.message
                // user is id
                // only get other message
                if(newMessage.user === isLogin[1].id) return
                // make sure chat with the current opened chat user 
                if(newMessage.user !== chatWith.id) return
                // change user id to display name
                newMessage.user = chatWith.display_name
                // messages data
                const tempMessages: IMessage['messages'][0] = {
                    user: newMessage.user,
                    style: newMessage.style,
                    text: newMessage.text,
                    time: newMessage.time,
                    date: newMessage.date
                }
                // add message from other
                setMessageItems(data => addMessageItem(data, isLogin[1], chatWith, tempMessages))
            }
        }
        pubsub.addListener(publishedMessage)
        // unsub and remove listener
        return () => {
            pubsub.unsubscribe({ channels: ['chatting-app'] })
            pubsub.removeListener(publishedMessage)
        }
    }, [])

    // message items scroll
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
                { 
                    messageItems.length > 0 && historyMessages
                        ? <Messages messageItems={messageItems} chatWith={chatWith} />
                        : <div id="messageContainer" className="w-full max-h-full p-3 my-auto text-2xl"> Loading... </div>
                }
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

function Messages({ messageItems, chatWith }: {messageItems: IMessage[]; chatWith: LoginProfileType}) {
    const messageItemsFilter = messageItems.length === 0 ? null : messageItems.filter(v => v.user_with === chatWith.id)
    const messageItemsData = messageItemsFilter[0] ? messageItemsFilter[0] : null
    console.log({messageItemsData});
    
    return (
        // message container
        <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll">
            {
                // message items
                // match target id with chatwith id
                !messageItemsData ? null : messageItemsData.messages.map((m, i) => {
                    return <MessageItem msgItem={m} key={i} />
                })
            }
        </div>
    )
}

function MessageItem({msgItem}: {msgItem: IMessage['messages'][0]}) {
    return (
        <div className={`flex ${msgItem.style}`}>
            <div className="border rounded-md min-w-32 p-1 my-2 bg-orange-400 dark:bg-sky-700">
                {/* author & status*/}
                <p className="text-xs flex justify-between"> 
                    <span> {msgItem.user} </span>
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
    const formData: IDirectChatPayload = {
        // author is user_id
        user_me: userFrom.id,
        user_with: userTo.id,
        message: JSON.stringify(formInputs[0].value),
        time: messageTime,
        date: ''
    }
    // check message empty
    if(formData.message == '') return
    // append new message
    const tempMessages: IMessage['messages'][0] = {
        user: userFrom.display_name,
        style: 'justify-end',
        text: formInputs[0].value,
        time: messageTime,
        date: ''
    }
    setMessageItems(data => addMessageItem(data, userFrom, userTo, tempMessages))
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

function addMessageItem(data: IMessage[], userMe: LoginProfileType, userWith: LoginProfileType, tempMessages: IMessage['messages'][0]) {
    // temp message items data
    const tempData = data
    const isTargetExist = tempData.map(v => v.user_with).indexOf(userWith.id)
    // havent chat with this user yet
    if(isTargetExist === -1) {
        // push target data 
        tempData.push({
            user_me: userMe.id, 
            user_with: userWith.id, // ### YAKIN AUTHOR chatWith.id ???
            messages: [tempMessages]
        })
        // return data
        return tempData
    }
    // have chatted with this user
    else {
        tempData[isTargetExist].messages.push(tempMessages)
        // return data
        return tempData
    }
}