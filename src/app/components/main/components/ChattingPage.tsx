import { Dispatch, FormEvent, SetStateAction, useContext, useEffect } from "react";
import { ChatWithContext } from "../../../context/ChatWithContext";
import { LoginProfileContext, LoginProfileType } from "../../../context/LoginProfileContext";
import { IDirectChatPayload, IMessage, IResponse } from "../../../types";
import { addMessageItem, fetcher, qS, qSA } from "../../helper";
import { ListenerParameters } from "pubnub";
import { usePubNub } from "pubnub-react";
import { MiscContext } from "../../../context/MiscContext";
import LoadingPage from "../../loading";
import { CldImage } from "next-cloudinary";

export default function ChattingPage() {
    // get page for display
    const { isLoading } = useContext(MiscContext)
    // chat with context
    const { chatWith, messageItems, 
        setMessageItems, setHistoryMessageLog, 
        unreadMessageItems, setUnreadMessageItems } = useContext(ChatWithContext)
    // login profile context
    const { isLogin } = useContext(LoginProfileContext)

    // update unread message
    useEffect(() => {
        if(unreadMessageItems) {
            for(let user of unreadMessageItems) {
                // remove unread message data from the user after read it
                if(user.display_name === chatWith.display_name)
                    setUnreadMessageItems(data => data.filter(v => v.display_name !== chatWith.display_name))
            }
        }
    }, [unreadMessageItems])

    // message items scroll
    useEffect(() => {
        // scroll to bottom
        const messageContainer = qS('#messageContainer')
        if(messageContainer) messageContainer.scrollTo({top: messageContainer.scrollHeight})
    }, [messageItems])

    // pubnub
    const pubsub = usePubNub()
    // FOR CHAT AND UNREAD MESSAGES
    useEffect(() => {
        // subscribe
        const dmChannel = `DirectChat-${isLogin[1].id}`
        pubsub.subscribe({ channels: [dmChannel] })
        // get published message
        const publishedMessage: ListenerParameters =  {
            message: (data) => {
                const newMessage: IMessage['messages'][0] = data.message
                // only get other message
                if(newMessage.user === isLogin[1].display_name) return
                // make sure chat with the current opened chat user 
                // add the chat to unread messages
                if(newMessage.user !== chatWith.display_name) {
                    return setUnreadMessageItems(data => {
                        // data > 0
                        if(data) {
                            const isUserExist = data.map(v => v.display_name).indexOf(newMessage.user)
                            // still have unread message from this user
                            if(isUserExist !== -1) {
                                const newData = [
                                    ...data, 
                                    {
                                        display_name: newMessage.user, 
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
                                const newData = [...data, {display_name: newMessage.user, unread_messages: [newMessage.text]}]
                                return newData
                            }
                        }
                        // data still null
                        else {
                            const newData = [{
                                display_name: newMessage.user,
                                unread_messages: [newMessage.text]
                            }]
                            return newData
                        }
                    })
                }
                // messages data
                const tempMessages: IMessage['messages'][0] = {
                    user: newMessage.user,
                    style: newMessage.style,
                    text: newMessage.text,
                    time: newMessage.time,
                    date: newMessage.date,
                    created_at: newMessage.created_at
                }
                // add message from other, only add message if data != null
                setMessageItems(data => data ? [...data, tempMessages] : [tempMessages])
            }
        }
        pubsub.addListener(publishedMessage)
        // unsub and remove listener
        return () => {
            pubsub.unsubscribe({ channels: [dmChannel] })
            pubsub.removeListener(publishedMessage)
        }
    }, [chatWith])
    // profile photo
    let photoSrc = 'data:,' 
    if(isLogin[0] && isLogin[1].id === chatWith.id && isLogin[1].photo) photoSrc = isLogin[1].photo
    else if(chatWith && chatWith.photo) photoSrc = chatWith.photo

    return (
        <div className="grid grid-rows-8 h-screen p-2">
            {/* user */}
            <div className="flex justify-center gap-4 p-2">
                <div className={photoSrc == 'data:,' ? 'rounded-full border' : ''}>
                    <CldImage src={photoSrc} alt="pfp" width={64} height={64} radius={'max'}/>
                </div>
                <div className="">
                    <p> {chatWith.display_name} </p>
                    <p> {chatWith.is_login} </p>
                </div>
            </div>
            {/* chat box */}
            <div className="flex items-end row-span-6 border-b border-t">
                {
                    isLoading
                        ? <LoadingPage />
                        : messageItems
                            ? <Messages historyMessages={messageItems} />
                            // if null, show empty chat box
                            : <Messages historyMessages={messageItems} firstMessage={true} />
                }
            </div>
            {/* send message box */}
            <div className="flex items-center border-t border-black">
                <form className="flex justify-around w-full" onSubmit={(event) => sendChat(event, isLogin[1], chatWith, setMessageItems, setHistoryMessageLog)}>
                    <input type="text" className="text-xl p-1 w-4/5 rounded-md dark:text-black" id="messageBox" />
                    <button type="submit" className="inline-block bg-orange-400 dark:bg-orange-600 py-1 px-2 w-24 rounded-md"> 
                        Send 
                    </button>
                </form>
            </div>
        </div>
    )
}

function Messages({ historyMessages, firstMessage }: {historyMessages: IMessage['messages']; firstMessage?: boolean}) {
    if(firstMessage && !historyMessages) {
        console.log('firstMessage');
        
        return (
            // message container
            <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll"></div>
        )
    }
    // filter messages
    const _filteredMessages: IMessage['messages'] = []
    new Map(historyMessages.map(v => [v['created_at'], v])).forEach(v => _filteredMessages.push(v))
    // get dates
    const dateMessages: IMessage['messages'] = []
    new Map(_filteredMessages.map(v => [v['date'], v])).forEach(v => dateMessages.push(v))
    // month names
    const monthNames = ['January', 'February', 'March', 'April', 
                        'May', 'June', 'July', 'August', 
                        'September', 'October', 'November', 'December']
    return (
        // message container
        <div id="messageContainer" className="w-full max-h-full p-3 overflow-y-scroll">
            {
            // date items
            dateMessages.length === 0 
                ? null
                : dateMessages.map((d, i) => {
                    return (
                        <div key={i}>
                            <div className="sticky top-0 z-10">
                                <span className="bg-lime-300 dark:bg-pink-600 rounded-md p-1"> 
                                    {/* eg: 01/30/1999 to Januari 30, 1999 */}
                                    {d.date.replace(/\d+/, monthNames[+d.date.split('/')[0]-1]).replaceAll('/', ', ').replace(', ', ' ')} 
                                </span>
                            </div>
                            {
                                // message items
                                !_filteredMessages ? null : _filteredMessages.map((m, i) => {
                                    if(m.date === d.date)
                                        return <MessageItem msgItem={m} key={i} />
                                })
                            }
                        </div>
                    )
                })
            }
        </div>
    )
}

const currentTime = new Date().toISOString()
function MessageItem({msgItem}: {msgItem: IMessage['messages'][0]}) {
    return (
        <div className={`flex ${msgItem.style}`}>
            <div className="border rounded-md min-w-32 p-1 my-2 bg-orange-400 dark:bg-sky-700">
                {/* author & status*/}
                <p className="text-xs flex justify-between "> 
                    <span> {msgItem.user} </span>
                    <span id="messageStatus" className="brightness-150"> 
                        {   // for incoming messages
                            msgItem.style.includes('start') 
                                ? '✔' 
                                // check message item created_at 
                                // if past the current time consider delivered
                                : currentTime > msgItem.created_at 
                                    ? '✔' 
                                    // if no, the its delivering
                                    : '🕗' 
                        } 
                    </span>
                </p>
                {/* message */}
                <p className="text-left"> {msgItem.text} </p>
                {/* time */}
                <p className="text-right text-xs border-t"> {msgItem.time} </p>
            </div>
        </div>
    )
}

type MessageType<T> = Dispatch<SetStateAction<T>>
async function sendChat(ev: FormEvent<HTMLFormElement>, userFrom: LoginProfileType, userTo: LoginProfileType, setMessageItems: MessageType<IMessage['messages']>, setHistoryMessageLog: MessageType<IMessage[]>) {
    ev.preventDefault()
    // form inputs
    // filter button elements
    const formInputs = ([].slice.call(ev.currentTarget.elements) as any[]).filter(i => i.nodeName === 'INPUT')
    // check input empty
    if(formInputs[0].value === '') return
    // message payload
    const messageTime = new Date().toLocaleTimeString([], {hour12: false, hour: '2-digit', minute: '2-digit'})
    const messageDate = new Date().toLocaleDateString([], {day: '2-digit', month: '2-digit', year: 'numeric'})
    const formData: IDirectChatPayload = {
        // author is user_id
        user_me: userFrom.id,
        display_me: userFrom.display_name,
        user_with: userTo.id,
        message: JSON.stringify(formInputs[0].value),
        time: messageTime,
        date: messageDate,
        created_at: new Date().toISOString()
    }
    // check message empty
    if(formData.message == '') return
    // append new message
    const tempMessages: IMessage['messages'][0] = {
        user: userFrom.display_name,
        style: 'justify-end',
        text: formInputs[0].value,
        time: messageTime,
        date: messageDate,
        created_at: new Date().toISOString()
    }
    // check if data null
    setMessageItems(data => data ? [...data, tempMessages] : [tempMessages])
    // add message to history log
    setHistoryMessageLog(data => addMessageItem(data, userFrom, userTo, tempMessages))
    // empty message input
    const messageBox = qS('#messageBox') as HTMLInputElement
    messageBox.value = ''
    // access token
    const token = window.localStorage.getItem('accessToken')
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